# 2. Dataset Reality

The PartsTree migration was scoped against a Confluence-defined target architecture: a five-level merchandise hierarchy (Brand → Brand Family → Model → Model Variant → IPL → Parts), cataloger workflow flags governing what may sync to Shopware, and a custom IPL entity backed by CDN-resolved media. What the client actually supplied for assessment was a local BSON archive—not live DocumentDB—packaged as `input-sample-data.zip` containing `Opulent/catalog.zip` (702 MB outer zip, SHA-256 `e31a36c49a7439c9f971e2af6e4de5aee803518d67700dff5aa981620cc4ebf9`). Streaming profile of that archive (`source_profile.json`, profile verdict `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE`) reveals a catalog whose shape, cardinality, and join health diverge materially from the documented intent. This section states what is in the dataset, what is absent, and what those facts imply for migration feasibility.

## Archive composition and what is missing

The snapshot manifest (`source_snapshot_manifest.json`, verdict `INCONCLUSIVE`) confirms three BSON payloads with verified checksums and two critical absences. Present collections: **products** (5,142,183 documents), **inventory** (3,626,867 documents), and **accounts** (0 documents—empty file, checksum matches empty hash). Absent or incomplete: **assets** (no `assets.bson`; 81 `assets_staging_incremental_*.metadata.json` stubs only) and **attributes** (no `attributes.bson`). The catalog zip member list is exactly three BSON files—`accounts.bson`, `inventory.bson`, `products.bson`—with no separate brand, model, IPL, or asset collections.

That composition is sufficient to measure product and inventory shape at scale. It is insufficient to validate IPL diagram loading, media CDN resolution, attribute parity, or live change-stream behavior. The manifest explicitly defers the assets collection to a human migration lead; scope impact: `media_assets_to_shopware_media` and `ipls_to_custom_entity` load groups remain blocked at gate G0/G1. Per-BSON checksum verification is complete only for products, inventory, and the empty accounts file; assets and attributes remain on the pending list.

## Single polymorphic products collection

The dominant structural finding is that the source does not mirror Confluence's relational hierarchy. Instead of distinct `brands`, `models`, and `ipls` collections, the client stores **parts and models in one polymorphic `products` collection**, discriminated by a `type` field:

| `type` | Document count | Share of products |
|--------|---------------:|------------------:|
| `part` | 4,759,440 | 92.6% |
| `model` | 382,743 | 7.4% |
| **Total** | **5,142,183** | 100% |

All 382,743 model records live embedded alongside 4.76 million part SKUs. Brand identity is not normalized into entities; it appears as array fields (`marketing_brand`, `manufacturing_brand`) on individual documents. Top marketing brands by row count include Briggs & Stratton (424,769), Lawn-Boy (310,621), Toro Consumer (309,544), Toro Commercial (301,653), and Husqvarna (264,757)—fifteen sampled brands account for millions of rows, but none exist as joinable brand documents.

IPL relationships are encoded as string references on model rows, not as a dedicated IPL collection. **355,939 models** (93.0% of all models) carry a populated `products.ipl` field pointing at asset identifiers that cannot be resolved in this archive because `assets.bson` was never supplied. Shopware expects navigable category trees and/or custom entities for IPL diagrams; the source encodes hierarchy implicitly inside one collection. Every loader must branch on `type`, infer brand family from `product_family` / `marketing_brand`, and resolve IPL refs against a missing assets join path—multiplying transform rules, reconciliation surfaces, and the risk of silent hierarchy drift.

Equipment-type metadata, which Confluence ties to brand equipment landing pages, is overwhelmingly sparse: **4,784,435 documents** (93.0% of all products) have an empty `equipment_type`. Category SEO and equipment-type navigation cannot rely on source normalization; they require manual mapping, inference rules, or acceptance of degraded faceting.

## Workflow semantics: Confluence flags vs BSON reality

Confluence and cataloger documentation describe four workflow flags—**sync** (scheduled for sync), **review** (QA queue), **approved** (ready for downstream), **deleted** (soft delete)—as the ETL gate. Measured BSON stores workflow under nested **`meta.approved`**, **`meta.deleted`**, and **`meta.review`**. Top-level `sync` was not observed on profiled record samples; ingestion must map `meta.*` explicitly rather than assuming documented top-level flag names.

Counts across all 5,142,183 product documents:

- **`meta.approved=true`:** 5,115,638 (99.5%)
- **`meta.approved` false or missing:** 26,545 (0.5%)
- **`meta.deleted=true`:** 438,979 (8.5%)

Inventory workflow is tighter: 3,626,838 of 3,626,867 rows are approved (29 unapproved), and only 19 inventory rows carry `meta.deleted=true`.

The approval/deletion distribution has direct load implications. Roughly **438,979 soft-deleted products** remain in the master dump—they are not physically purged. Shopware publication policy must decide skip vs inactive load (open decision OD-06). The **26,545 unapproved products** cannot reach a storefront without overriding Confluence's approval contract. Dry-run grouping (`local-migration-dry-run-summary.json`) quantifies downstream impact: of 4,759,440 part candidates, **323,782 are blocked** and **4,435,658 are loadable** under gates requiring approved=true and deleted=false; of 382,743 model candidates, **141,758 are blocked** and **240,985 are loadable**. Quality-issue rollups align: 438,998 source-marked deleted (rounding vs profile), 26,574 unapproved.

A 10,000-part / 1,000-model transform sample (`transform_stats.json`) applied publication policy `skip` for deleted rows: 77 skipped as deleted, 0 skipped as unapproved or in review—consistent with the rare incidence of non-approved rows in the sample draw. The sample's 28.4% error rate was driven not by workflow flags but by structural blockers (2,065 blocked for missing media, 923 blocked for model mapping), illustrating that workflow gating is a secondary filter compared to schema and asset gaps.

## Stock and inventory: split identity, split completeness

Sellable catalog identity and fulfillment state are deliberately separated. Parts reference stock via **`products.stock` → `inventory.source`**. The join was measured across the full corpus:

| Join outcome | Count | Notes |
|--------------|------:|-------|
| Join OK | 4,168,881 | Stock ref resolves to inventory row |
| Empty `products.stock` | 973,287 | 20.4% of parts—no join key |
| Stock ref missing in inventory | 15 | Orphan refs (16 in dry-run rollup) |

**973,287 parts** (20.4%) have no stock pointer. Dry-run quality counts report **590,649** product missing-stock-ref issues—a broader DQ category that includes empty stock and related failures. Without a frozen fallback contract, these rows cannot receive price or quantity in Shopware. The transform sample used **`STOCK_FALLBACK=zero`**, applying the fallback on 1,054 of 11,000 normalized rows—demonstrating that policy choice materially affects salability and search facets.

The inventory collection holds **3,626,867** documents with **3,626,863** distinct `source` values—near 1:1 with row count, though Confluence notes multiple part SKUs can share one stock row (brand-name variants). Inventory completeness is weaker than product approval rates:

- **`quantity_on_hand` missing:** 2,735,879 (75.4%)
- **`availability=nla` (no longer available):** 2,571,968 (70.9%)
- **`availability=ava` (available):** 1,054,856
- **`availability=obs` (obsolete):** 43
- **Unparseable price:** 3,670
- **Price outlier > $100,000:** 105 (max observed **$380,729.99**)

Shopware product stock is a scalar on the product entity; the source splits sellable identity (`products.source`) from fulfillment identity (`inventory.source`) and encodes discontinuation as an availability code distinct from quantity zero. **2,571,968 NLA rows** require semantic mapping—storefront "unavailable" is not the same as qty=0. Dry-run inventory grouping shows **3,623,149 of 3,626,867** inventory rows loadable vs **3,718 blocked** (price parse failures dominate). **`source_touch_missing`** on 3,340,167 inventory rows signals incomplete lineage metadata for incremental sync designs.

## Media, photos, and the assets gap

Photo coverage on products is minimal: **4,622,287 documents** (89.9%) have empty `photos[]`. The remaining ~10% reference asset IDs, but **`assets.bson` is absent** from the archive—only 81 incremental metadata stubs exist, implying a pipeline for staged asset delivery rather than a point-in-time snapshot. Confluence specifies IPL custom entity plugin behavior and CDN-backed media; without an assets join path, every part with photo refs blocks media resolution.

Dry-run confirms zero candidates for `media_assets_to_shopware_media` (blocked: full assets.bson not supplied) and zero for `ipls_to_custom_entity` (blocked: assets/IPL source not supplied and plugin/API not externally validated). **355,939 models with IPL fields** cannot be verified against diagram payloads. Transform sample policy requiring assets produced **2,065 blocked_no_media** outcomes on 11,000 rows—a ~20% block rate that scales to hundreds of thousands of media operations once assets exist, demanding idempotent Admin API upserts and a client CDN URL contract.

## Scale and throughput implications

At 5.14 million product documents and 3.63 million inventory rows, naive full-document event payloads exceed practical bus limits. Confluence's compact ID-only EventBridge design (fetch-on-process, idempotent upsert) is mandatory at this scale. The sample archive proves the corpus is large enough to stress batch manifests, DQ queues, and reconciliation—not a toy dataset—while simultaneously proving it is incomplete for media/IPL cutover certification.

## Gap profile verdict

Measured against Confluence intent, the client dataset presents a **bifurcated reality**:

**What the archive supports.** High-confidence profiling of part and model cardinality, marketing-brand distribution, workflow flag incidence, stock-to-inventory join health, inventory availability and price anomalies, and dry-run loadability for parts (93.1% loadable under approval/deletion gates), models (63.0% loadable), and inventory (99.9% loadable).

**What the archive cannot support.** IPL diagram validation, media CDN resolution, attribute schema parity, accounts scope (empty collection), live DocumentDB change-stream behavior, or production-freeze certification (G0). The profile verdict and manifest verdict both stop short of `VERIFIED`: sample environment explicitly labeled `sample_archive_not_live_documentdb`.

**Structural debt.** Single-collection polymorphism, sparse equipment types, split stock/inventory identity, NLA vs quantity semantics, and 81 asset staging stubs without BSON payload collectively mean migration engineering must spend disproportionate effort on mapping contracts and human policy decisions (publication of deleted/unapproved rows, stock fallback, NLA storefront semantics, CDN base URL) before loader agents can self-certify.

The dataset is real, large, and joinable for core parts-and-price migration. It is not the complete, production-frozen, media-complete source that Confluence-described Shopware parity requires. Section 03 and downstream gate verification must treat measured counts here as floor truths for what was provable locally—and explicit deferrals for everything the archive never contained.
