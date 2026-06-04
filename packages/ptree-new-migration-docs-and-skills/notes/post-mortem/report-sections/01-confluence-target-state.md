# 1. Confluence Target State

The PartsTree Catalog DB → Shopware migration was specified in Confluence (`Confluence-PTREE-010626-130110.pdf`, cited here as the architecture export) and elaborated in the client overview `partstree_catalog_shopware_overview.md`. Together they define a **target state**, not a description of what the BSON sample contains. The export positions Catalog DB (Mongo-compatible DocumentDB in AWS VPC) as the authoritative source of truth and Shopware 6 as the commerce, search, navigation, and partially headless content layer. Synchronization is continuous: baseline ETL loads the full catalog once; ongoing change streams keep Shopware aligned with cataloger edits, stock updates, and media refreshes. This section reconstructs that intended architecture—the hierarchy, Shopware constructs, workflow gates, sync topology, and MVP boundaries—as the baseline against which migration success was supposed to be measured.

## Catalog hierarchy and navigation intent

Confluence describes a six-level merchandise tree that governs both storefront navigation and loader dependency order:

```text
Brand → Brand Family → Model → Model Variant → IPL (illustrated parts list) → Parts
```

Each level carries distinct semantics. **Brand** (e.g., Echo, Cub Cadet, Gravely) maps to top-level Shopware categories and often to manufacturers; brands are stable, ingestion-created, and rarely deleted. **Brand Family** (e.g., Echo Chainsaws, Exmark Navigator) sits under brand and groups equipment by type for SEO and landing-page navigation; Confluence treats it as a first-class category even when the source DB infers it from model metadata rather than storing a dedicated entity. **Model** represents a specific equipment line; commerce planning assumed on the order of **~300,000** model records, though measured BSON later showed **382,743** `type=model` rows—a scale delta the target must still accommodate. **Model Variant** captures sub-configurations within a model where the catalog differentiates them. **IPL** is the illustrated parts diagram—the interactive schematic linking hotspot coordinates to part SKUs—not a sellable product. **Parts** are the **4.4M+** sellable SKUs (Confluence and Sync API planning cite **~4.4 million** part products plus **~241,000** category nodes once models and IPL navigation layers are materialized).

The hierarchy is not decorative. It drives URL structure, Store API associations, category indexing, and the phased loader sequence: manufacturers and tax foundations first, then category tree, then IPL custom entities, then part products, then media associations, then inventory deltas. Confluence explicitly rejects treating the CDN as a parallel product catalog; media URLs flow through Shopware custom fields and media entities while reusing the existing PartsTree CDN (CloudFront over S3, with origin access control per AWS guidance referenced in the target systems index).

## Shopware 6 MVP: categories, custom entities, and custom fields

The Confluence MVP centers on **Shopware 6 Admin API** bulk writes via `POST /api/_action/sync`, with indexing deferred through `indexing-behavior: use-queue-indexing` during migration-scale loads. Target-side identity is deterministic: stable 32-character hex UUIDs derived from source keys (`products.source`, `inventory.source`) so retries at millions of rows do not create duplicates.

**Categories** carry navigational hierarchy—brand, brand family, model, and potentially model variant and IPL category nodes depending on the unresolved model-mapping decision (see below). Categories expose native SEO paths and Store API category trees; scalar PartsTree metadata that does not warrant relational structure lives in **custom fields** on category, product, and related entities. Confluence specifies the **`custom_` prefix** convention (documented around pages 61–65 of the export); the assessment schema bundle names representative fields such as `custom_part_source_id`, `custom_part_pt_stock_id`, `custom_part_availability_code` (enum `ava`, `nla`, `obs`), `custom_images_cdn_url`, `custom_model_source_id`, `custom_ipl_source_id`, `custom_equipment_type`, and `custom_meta_review`. Parity of **30+ custom fields** across dev, staging, and prod is a G3 gate requirement; the IPL plugin adds entity-specific fields beyond this bundle.

**IPL diagrams** are not modeled as categories alone or as JSON blobs on products at scale. Confluence mandates the **`PartsTreeIplPlugin`**: a **custom entity `ipl`** with join tables (`ipl_model`, `ipl_product`) for many-to-many associations between diagrams, models, and part products. Hotspots, SVG/raster references, and diagram metadata belong on the custom entity; **355,939** source models carry `ipl[]` string refs in BSON, implying hundreds of thousands of IPL associations once assets are joinable. The plugin must remain upgrade-safe per Shopware extension guidelines—custom entities and joins, not ad-hoc product extensions that break platform upgrades.

**Parts** map to standard Shopware `product` entities with `productNumber` equal to source SKU, stock on `product.stock` (or Multi-Inventory API if warehouse groups are adopted), visibility and `active` flags driven by workflow policy, and custom fields for scalar catalog attributes. Stock joins source `products.stock` → `inventory.source`; Confluence acknowledges brand-name variant sharing of inventory rows, so the target expects explicit join logic rather than assuming one SKU per stock document.

The recommended hybrid from DeepWiki assessment (aligned with Confluence intent) reads:

```text
Category tree (brand → family → model [→ variant])
  ↔ custom field source IDs
Custom entity ipl (PartsTreeIplPlugin)
  ↔ ipl_model ↔ model refs
  ↔ ipl_product ↔ part products
Product (part) + custom_fields + Shopware media + CDN URL custom field
```

## Option 1 vs Option 2: the unresolved model fork

Confluence left **Models→IPLs** as an open architectural fork—recorded in the program as open decision **OD-01** and blocking **141,758** model rows in dry-run until resolved:

- **Option 1 — models as categories:** Model records become Shopware category nodes under brand family, with IPLs represented as child categories and/or linked via the IPL custom entity plugin. This path maximizes native category navigation and SEO but pushes category volume toward **~241,000 loadable models** plus IPL category layers—stressing Sync API batch sizing and indexer queues.

- **Option 2 — models as custom entities (or alternate graph):** Models depart from the pure category tree, using custom entities and join tables for model↔IPL relationships while categories handle brand/family navigation only. This reduces category cardinality but requires custom entity Store API exposure and more plugin surface area.

Until the domain owner chooses Option 1 or Option 2, Confluence's own dependency graph blocks Phase 2 (category tree) and cascades into IPL and part association loaders. Assessment measured **923 of 1,000** sample models blocked (**92.3%**) when mapping remained undecided—demonstrating that the target state was specified but not **frozen**, a distinction this report treats as a governance failure rather than a technical surprise.

## Media and CDN contract

Confluence specifies reuse of the existing PartsTree CDN rather than building a shadow media system. The contract chain is: **`assets` collection** in Catalog DB → resolve binary and metadata → construct public CDN URL → Shopware **`media`** entity + **`product_media`** association, with **`custom_images_cdn_url`** (or equivalent) retaining the canonical external URL per Shopware media-path ADR guidance. IPL diagram assets follow the same path into the IPL custom entity. S3 holds object storage; CloudFront with origin access control serves public URLs. **`CDN_BASE_URL`** is a required environment variable in the access matrix; without it, transforms cannot resolve photo refs on the **~520,000** products with non-empty `photos[]` observed in BSON profiling.

The target does **not** authorize loading parts with unresolved media when policy requires assets join—Confluence treats media as part of the sellable catalog surface, not an optional post-load cosmetic step.

## Cataloger workflow: sync, review, approved, deleted

Cataloger operations in the source system use four workflow flags that Confluence maps directly to ETL and sync gating:

| Flag | Confluence meaning | Target behavior |
|------|-------------------|-----------------|
| **sync** | Scheduled for synchronization | Row eligible for downstream pickup |
| **review** | In QA queue | Hold from storefront until cleared |
| **approved** | Ready for website/API consumers | May load to Shopware as active/salable per policy |
| **deleted** | Soft delete | Must not appear as salable; explicit skip or `active: false` |

The **CRON ETL** path (batch baseline load) checks **approved** and **deleted** (among other flags) before invoking the website API—only publication-ready rows reach Shopware. The **continuous EventBridge sync** design inherits the same gating: compact-event processors must apply identical publication rules when fetching authoritative state from DocumentDB and normalizing to Shopware payloads. Allowing the event processor to bypass CRON checks would violate the cataloger's approval contract and risk loading **438,979** soft-deleted or **26,545** unapproved products if BSON `meta.*` fields are mapped incorrectly.

Confluence documents top-level flag names; measured source data often nests equivalents under `meta.approved`, `meta.deleted`, and `meta.review`, with top-level `sync` rarely populated. The **target contract** is semantic (approved/deleted/review/sync behavior), not positional field names—the normalization layer must map `meta.*` explicitly while preserving Confluence gating intent in both CRON and event paths.

## Baseline ETL vs ongoing sync (Phase 7)

Confluence distinguishes two modes that share normalization code:

**Baseline load (Batch D–E):** Dependency-ordered loaders write manufacturers, categories, IPL entities, products, media, and inventory through Admin API Sync batches (50–200 products per batch initially, tuned against 429 rate limits). Each batch produces a hash ledger (`source_id`, `target_id`, `payload_hash`, `status`, `replay_token`); loaders do not self-certify—independent reconciliation compares payload hashes to target read-back JSON.

**Ongoing sync (Batch F / Phase 7):** DocumentDB **change streams** on `products`, `inventory`, and `assets` emit notifications—not full documents. A **.NET change-stream consumer on ECS** (per Confluence) or collector Lambda strips payloads to **compact events**: roughly twelve properties (`eventVersion`, `eventType`, `correlationId`, `sourceCollection`, `sourceId`, `changeType`, `emittedAt`, optional `workflowHint`, change stream token)—**never embedded BSON**. At **5,142,183** product documents, naïve full-document EventBridge emission at even ~1 KB per detail exceeds practical bus limits; typical product rows with `ipl[]` and `photos[]` arrays approach DocumentDB's **16 MB** change-stream event ceiling and EventBridge's **~256 KB** per-entry limit.

**EventBridge** routes by `detail-type` to entity-specific Lambda processors (model, part, inventory, IPL, media—five Confluence event types in the assessment SAM template). EventBridge is **orchestration only**, not the system of record.

**DynamoDB ledger** (`ptree-sync-event-ledger-{env}`) holds idempotent state: partition key `SOURCE#{collection}#{sourceId}`, sort key `EVENT#{correlationId}`, status enum `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`, plus `payloadHash`, `retryCount`, `lastError`, and `replayCommand`. Processors check the ledger before fetch-and-upsert; duplicate at-least-once delivery from change streams skips rows already `COMPLETED`. Failed rows retain replay tokens; a **daily reconciler** compares DocumentDB truth to Shopware state.

Change-stream retention defaults to **3 hours** (7-day maximum), mandating persisted resume tokens in DynamoDB or SSM so extended outages trigger full reconcile rather than silent gap. DocumentDB limitations—no classic oplog, unsupported `$facet` and correlated `$lookup` on older compatibility versions—force precomputed fields or offline enrichment rather than in-stream aggregation.

## MVP scope boundaries

Confluence MVP explicitly includes: Shopware 6 catalog with custom fields and IPL plugin; headless Store API consumption; external CDN media; DocumentDB→Shopware sync infrastructure (EventBridge, Lambda, DynamoDB, ECS consumer); and cataloger workflow fidelity. It defers or scopes out: treating sample BSON as production freeze (production manifest and live DocumentDB access remain gates); loading IPL/media without `assets.bson`; and Batch D loaders before G0–G4 verification (access manifest, source profile, zero-blocker mapping contract, target schema smoke, dry-run payloads with issue ledgers).

Scale assumptions baked into the target: **~4.4M part products**, **~241K–383K model/category nodes** depending on OD-01, **~1M IPL category or entity associations** at the high end of diagram coverage, **3.6M inventory rows**, and sync throughput bounded by Shopware indexing queues and OAuth rate limits (self-hosted vs SaaS limits require environment smoke).

## Summary of the specified end state

Confluence's target state is a **layered Shopware catalog** mirroring an equipment hierarchy, augmented by a **custom IPL plugin** for diagrams, **prefixed custom fields** for PartsTree scalar metadata, **CDN-backed media** flowing through Shopware entities, **cataloger workflow gates** applied uniformly in CRON and event processors, and an **AWS sync plane** where DocumentDB change streams trigger compact, ledger-backed, idempotent upserts—not full-document event buses. The architecture is coherent at scale; what the migration post-mortem documents elsewhere is the gap between this specification and frozen contracts, measured source shape, and verified target writes—not ambiguity in Confluence's intent.
