# PartsTree → Shopware migration — glossary & findings

**Audience:** Client demo sponsors and domain owners  
**Evidence window:** Opulent sample profile `opulent-sample-bson-2026-06-02` (measured 2026-06-04)  
**Primary sources:** Confluence export `client-data/confluence/Confluence-PTREE-010626-130110.pdf`, `source_profile.json`, `discoveries/intent/intent-comparison-report.md`, `discoveries/blockers/blocker-delay-matrix.tsv`. Post-mortem themes cited for synthesis only — not standalone proof.

---

## Part 1 — Glossary

Terms are grouped for readability; within each group, entries are alphabetical.

### Source platform & archive

**BSON collections** — Binary JSON exports of MongoDB-style collections (`products.bson`, `inventory.bson`, `accounts.bson`, and optionally `assets.bson`, `attributes.bson`) packaged inside `catalog.zip`. In the measured Opulent sample, only products, inventory, and empty accounts are present; assets and attributes are absent from the archive.

**Catalog DB** — PartsTree’s authoritative catalog database (Mongo-compatible **DocumentDB** in AWS), holding products, inventory, media assets, and cataloger workflow state. Confluence treats it as the system of record; Shopware is a synchronized commerce and navigation layer.

**DocumentDB** — AWS-managed Mongo-compatible database hosting the live catalog. Confluence’s ongoing sync design relies on **change streams** on products, inventory, and assets; the June 2026 assessment used a static BSON sample, not live stream behavior.

**Opulent sample** — Client-provided archive (`input-sample-data.zip` → `Opulent/catalog.zip`) used for migration analysis. Profile verdict: **measured sample, not a production freeze** — suitable for scale and shape discovery, not cutover sign-off by itself.

**Polymorphic `products` collection** — One BSON collection holds both sellable **parts** (`type=part`, 4,759,440 rows) and equipment **models** (`type=model`, 382,743 rows), with brand and hierarchy signals embedded in arrays (`marketing_brand`, `equipment_type`) rather than separate brand/IPL collections. Confluence’s six-level tree assumes layered entities; the sample collapses much of that into one collection.

**Production freeze** — A signed, checksum-backed snapshot of live DocumentDB (or equivalent) taken before cutover. Confluence MVP requires this boundary; the current profile explicitly is **not** a production freeze.

**Source snapshot manifest** — `client-data/manifests/source_snapshot_manifest.json` records which collections are verified, missing, or deferred (notably **assets** and **attributes**) for the sample boundary.

### Target platform (Shopware 6)

**Admin API Sync (`POST /api/_action/sync`)** — Shopware bulk write path for migration-scale loads (manufacturers, categories, products, media). Confluence specifies batched sync with deferred indexing (`indexing-behavior: use-queue-indexing`) and deterministic target IDs from source keys.

**Custom entity** — Shopware extension construct for data that does not fit standard product/category tables. Confluence mandates a custom entity **`ipl`** (via **PartsTreeIplPlugin**) with join tables `ipl_model` and `ipl_product` for diagram ↔ model ↔ part associations.

**Custom fields (`custom_` prefix)** — Scalar PartsTree metadata on Shopware entities (e.g. `custom_part_source_id`, `custom_images_cdn_url`, `custom_equipment_type`). Confluence requires **30+ fields** with dev/stage/prod parity (G3 gate); pages 61–65 of the export document naming conventions.

**Shopware 6** — Target commerce platform: catalog, search, Store API (headless), media entities, and Admin API. Migration goal is parity with PartsTree navigation, IPL diagrams, workflow gates, and CDN-backed imagery — not a parallel shadow catalog.

**Store API** — Headless read surface for storefronts consuming the migrated hierarchy, products, and IPL associations after baseline load and ongoing sync.

### Merchandise hierarchy (Confluence six levels)

**Brand** — Top-level manufacturer or house brand (e.g. Husqvarna, Toro). Maps to Shopware categories/manufacturers; stable and rarely deleted in Confluence.

**Brand family** — Group under brand by equipment type (e.g. “Echo Chainsaws”) for SEO and landing navigation. Often inferred from model metadata when not stored as its own collection.

**Illustrated parts list (IPL)** — Interactive schematic linking diagram hotspots to part SKUs; **not** a sellable product. Loaded via **PartsTreeIplPlugin**, not as unstructured JSON on products at scale.

**Model** — Equipment line record (`type=model` in BSON). Confluence planned ~300K models; sample has **382,743**. Placement in Shopware (category vs custom entity) is the open **model mapping decision**.

**Model variant** — Sub-configuration within a model where the catalog differentiates variants. Feeds category or custom-entity graph depending on mapping decision.

**Part** — Sellable SKU (`type=part`). Confluence cites **~4.4M+** parts; sample measures **4,759,440** — scale intent is met, but stock, media, and transform readiness are separate questions.

### Workflow, availability & joins

**Availability codes (`ava`, `nla`, `obs`)** — PartsTree inventory availability semantics mapped to custom fields (e.g. `custom_part_availability_code`). **NLA** (no longer available) appears on **70.9%** of inventory rows in the sample; Confluence warns NLA is not the same as Shopware quantity zero without an explicit contract.

**Cataloger workflow (`sync`, `review`, `approved`, `deleted`)** — Four flags gating whether rows reach the website API, CRON ETL, and EventBridge processors. Confluence uses top-level names; BSON often nests equivalents under **`meta.approved`**, **`meta.deleted`**, **`meta.review`**, with top-level `sync` rare — normalization must preserve semantics, not field names.

**CRON ETL (baseline load)** — Scheduled full-catalog load path that checks approval and deletion before Shopware writes. Shares normalization rules with ongoing sync; must not bypass workflow gates.

**Publication policy** — Rules for soft-deleted (**438,979** products, 8.5%) and unapproved (**26,545**) rows: skip, load inactive, or other — must be signed before treating dry-run skips as production behavior.

**Stock join (`products.stock` → `inventory.source`)** — Part price and quantity come from linking the product’s stock key to an inventory document. Confluence targets **&lt;1%** parts with empty stock; sample shows **20.4%** (973,287 parts) with no `stock` ref.

**STOCK_FALLBACK** — Transform policy that substitutes zero stock when join data is missing. Used **1,054** times in the 11k dry-run sample — inflates success metrics while masking join gaps.

### Media, CDN & assets

**Assets collection (`assets.bson`)** — Catalog DB collection holding media metadata and binary references for product photos and IPL diagrams. **Missing** in the Opulent sample (81 metadata stubs only); blocks CDN URL materialization and IPL verification.

**CDN (CloudFront + S3)** — Existing PartsTree content delivery network; Confluence reuses it rather than duplicating media in Shopware alone. URLs flow to Shopware **media** entities and custom fields such as `custom_images_cdn_url`; requires **`CDN_BASE_URL`** in the access matrix (null in sample transforms).

**Product media path** — `photos[]` on products → resolve via assets → CDN URL → Shopware media + `product_media` association. ~**520K** products have non-empty `photos[]`, but without `assets.bson` joins cannot be verified in this archive.

### Ongoing sync (AWS)

**Baseline ETL vs ongoing sync** — **Baseline:** one-time dependency-ordered loaders (Batch D–E) through Admin API Sync with hash ledgers and reconciliation. **Ongoing:** DocumentDB change streams → compact events → EventBridge → Lambdas → Shopware upserts with DynamoDB idempotency (Batch F / Phase 7). Same normalization code; different transport and scale constraints.

**Change stream** — DocumentDB real-time change feed on collections (products, inventory, assets). Retention is short (hours to days); resume tokens and reconcilers are required so outages do not silently drop updates.

**Compact event** — Small EventBridge payload (~12 properties: collection, source id, change type, correlation id, etc.) — **never** full BSON documents. At **5.14M** product documents, full-document events risk EventBridge (~256 KB) and stream size limits.

**DynamoDB sync ledger** — Idempotency table (`ptree-sync-event-ledger-{env}`) tracking PENDING → COMPLETED per source id and event, enabling safe retries and daily reconciliation against DocumentDB and Shopware.

**EventBridge** — AWS event bus routing compact catalog changes to entity-specific processors (model, part, inventory, IPL, media). Orchestration only — not the system of record.

### Decisions & verification artifacts

**Model mapping decision (Option 1 vs Option 2)** — Whether equipment **models** become Shopware **categories** under brand family (Option 1) or use **custom entities** / alternate graphs (Option 2). Unresolved in sample transforms (`UNDECIDED`); **92.3%** of model sample rows block on mapping.

**Payload hash ledger** — SQLite (or equivalent) recording `source_id`, `target_id`, `payload_hash` per dry-run/load batch for independent reconciliation (G4). Sample assessment: ledger not verified — gate passed on summary JSON only in the prior program.

**Transform dry-run** — 11,000-row sample (10,000 parts + 1,000 models) mapping BSON → Shopware payloads without production writes. **71.6%** success (**7,879/11,000**); **28.37%** blocked or skipped — dominated by missing media and undecided model mapping.

---

## Part 2 — Major findings → key blockers

Measured values from `source_profile.json` and `transform_stats.json` unless noted. Blocker themes align with discovery matrix rows (DISC-*) and human-readable names — not gate IDs as primary labels.

| Finding (measured or documented) | Why it matters | Key blocker theme | Client action |
|----------------------------------|----------------|-------------------|---------------|
| **5,142,183** product documents (**4.76M** parts, **383K** models) in sample | Confirms Confluence scale (~4.4M parts) but one polymorphic collection, not layered hierarchy BSON | **Collapsed hierarchy** (DISC-007) | Week 1: agree derived hierarchy rules from embedded brand/family signals; do not assume separate brand/IPL collections in export |
| **`hierarchy_collections_present=false`**; **93.0%** empty `equipment_type` | Store navigation (Brand→Family→Model→IPL→Parts) cannot mirror Confluence from BSON alone | **Collapsed hierarchy** (DISC-007) | Commission mapping contract for inferred tree; budget hierarchy rework if Confluence strict parity required |
| **Model mapping undecided** — **92.3%** sample models blocked; **~141,758** est. full corpus | Blocks category tree, IPL associations, and model loaders | **Model mapping decision** (DISC-003) | Domain owner signs Option 1 (categories) or Option 2 (custom entity) by week 2 |
| **`assets.bson` missing**; **355,939** products with `ipl[]` refs | IPL plugin and diagram loads cannot be verified; refs are not loadable entities without assets | **Missing assets export** (DISC-001, DISC-013) | Deliver full `assets.bson` or signed deferral in snapshot manifest before media/IPL batch |
| **`CDN_BASE` null**; **20.65%** part sample `blocked_no_media` | Sellable parts with `photos[]` cannot resolve URLs; policy blocks load without media | **Missing assets export / CDN contract** (DISC-011) | Provide `CDN_BASE_URL` + assets export; Media/IPL contract week 4 hard stop |
| **89.9%** empty `photos[]`**; ~520K non-empty photo refs | Media gap is not “no photos” only — joins still need assets BSON | **Missing assets export** (DISC-001) | Same as assets deliverable; do not start production media loader on stubs alone |
| **438,979** soft-deleted products (**8.5%**) still in dump | Risk of salable deleted SKUs if event path bypasses CRON skip rules | **Publication & workflow mapping** (DISC-004) | Sign publication policy (skip vs inactive) for deleted and **26,545** unapproved rows |
| **`meta.*` vs Confluence `sync`/`review`/`approved`/`deleted`** | ETL and EventBridge must share one semantic map | **Publication & workflow mapping** (DISC-004) | Approve explicit `meta.*` → Shopware visibility map for baseline and sync |
| **`attributes.bson` missing** | Attribute-heavy custom fields unprofiled | **Missing attributes export** (DISC-014) | Confirm scope: deliver attributes BSON or descope fields with sign-off |
| **973,287** parts (**20.4%**) with empty `stock` | Fails Confluence “&lt;1% empty stock” intent; price/qty cannot resolve | **Stock & inventory contract** (DISC-005, DISC-015) | Decide OD-04/OD-05: fallback qty, NLA semantics, and whether zero fallback is allowed in prod |
| **75.4%** inventory rows missing `quantity_on_hand`; **70.9% NLA** | Shopware stock cannot mirror source without qty/NLA rules | **Stock & inventory contract** (DISC-006) | Map NLA/ava/obs to Shopware stock and custom fields; do not treat NLA as qty=0 by default |
| **3,670** unparseable inventory prices; **56** sample price-parse blocks | Pricing errors at scale if parser rules unchanged | **Data quality — pricing** (DISC-012, partial) | Publish price normalization rules and exception queue |
| **81.1%** stock ref join_ok (incl. models); **15** orphan stock refs | Join health looks “good” until empty-stock parts excluded — **INT-007** still GAP | **Stock & inventory contract** (DISC-005, DISC-017) | Fix empty-stock policy before trusting join_ok headline metric |
| **71.6%** transform sample success; **28.37%** error rate | Prior program advanced loaders while ~1/3 sample rows failed contracts | **Transform verification** (DISC-008, DISC-009) | No Batch D until G4 reconciliation + hash ledger verified on target read-back |
| **`profile_verdict=MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE`** | Cutover and change-stream behavior unproven on live DocumentDB | **Production source boundary** (DISC-002) | Week 0: OD-16 go/no-go — production freeze date, live access, and reconciler plan |
| **5.14M** products — full-document EventBridge risk | Ongoing sync can exceed bus/size limits at scale | **Compact ongoing sync design** (DISC-010) | Implement ID-only compact events + ledger before scaling sync; paper design week 10+ per recovery plan |
| **Part count PASS** (4.76M &gt; 4.4M plan) | Scale planning OK; **not** load readiness | *(none — informational)* | Treat PASS as cardinality only; pair with blockers above for go-live |

**Finding count:** **16** rows (15 actionable blockers + 1 informational scale confirmation).

---

## Part 3 — Executive summary (demo sponsor)

The Confluence target for PartsTree is clear and commercially coherent: a six-level equipment hierarchy in Shopware 6, IPL diagrams via a dedicated plugin, CDN-backed media, cataloger-approved publication, and compact AWS sync from DocumentDB at roughly five million products. The June 2026 measured sample confirms **part-scale volume** (4.76M parts) but not readiness to load: the archive is a **sample, not a production freeze**, ships **without `assets.bson` or `attributes.bson`**, and stores brands and IPL refs inside a **single products collection** rather than the layered collections the target narrative assumes. Three decisions and deliverables dominate delay risk: **where models live in Shopware** (still undecided, blocking ~92% of model transforms in sample), **how deleted and unapproved rows publish** (439K deleted, 26K unapproved), and **restoring the assets/CDN path** for media and 356K IPL references. Stock and inventory contracts remain open—one in five parts lacks a stock key, three in four inventory rows lack quantity on hand, and dry-run “success” partly reflects **fallback policies**, not storefront parity (**71.6%** sample success with **28.4%** blocked/skipped). A gated twelve-week replay (profile week 1, mapping decisions week 2, assets week 4, verified dry-run weeks 5–6, then loaders) surfaces these items before Batch D; **16 of 17** measured discoveries were preventable in the first month of that sequence. Sponsors should treat verification and client deliverables as **stop conditions**, not parallel paperwork, if the program is to reach Confluence parity without repeating nine months of rework.

---

## Related artifacts

| Document | Path |
|----------|------|
| Governed metrics | `discoveries/semantic-layer.md` |
| Intent vs sample | `discoveries/intent/intent-comparison-report.md` |
| Blocker matrix | `discoveries/blockers/blocker-delay-matrix.tsv` |
| Blocker narrative | `discoveries/blockers/blocker-delay-narrative.md` |
| Consolidated findings | `notes/post-mortem/analysis-findings-report.md` |
| Evidence index | `notes/evidence_index.md` |

*Post-mortem synthesis (`notes/post-mortem/ptree-migration-postmortem-report.md`) informed blocker themes only; counts above cite profile and transform outputs.*
