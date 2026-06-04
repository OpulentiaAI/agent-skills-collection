# Client data gap profile

**Generated:** 2026-06-04 · **Profile measured:** 2026-06-04T01:17:16Z · **Profile ID:** `opulent-sample-bson-2026-06-02`

**Evidence scope:** Confluence export `Confluence-PTREE-010626-130110.pdf`, BSON sample archive (`input-sample-data.zip` → `Opulent/catalog.zip`), and `partstree_catalog_shopware_overview.md`. Counts below are measured from streaming BSON — not consulting gate artifacts.

**Governed metrics:** Use named metrics from `semantic-layer.md` (e.g. `parts_with_empty_stock_rate`, `model_mapping_block_rate_sample`) instead of re-deriving counts. Agent procedure: [analysis-self-service-guide.md](analysis-self-service-guide.md).

**Cross-analysis:** [analysis-findings-report.md](analysis-findings-report.md) (rollup) · [intent-comparison-report.md](intent-comparison-report.md) · [blocker-delay-narrative.md](blocker-delay-narrative.md) · [segment-findings/](segment-findings/)

---

## Hierarchy mismatch (single collection vs Brand→Model→IPL→Parts)

Confluence and the client overview describe a five-level merchandise tree (Brand → Brand Family → Model → Model Variant → IPL → Parts). The sample BSON contains **no separate** `brands`, `models`, or `ipls` collections — only `products.bson` with `type=part` (4,759,440 docs) and `type=model` (382,743 docs). IPL relationships appear as string refs on product rows (`products_with_ipl_field_count` = **355,939** at **product doc** grain — not models-only; see [segment-findings/products_models.md](segment-findings/products_models.md)).

**Schema difficulty:** Shopware expects navigable category trees and/or custom entities for IPL diagrams. The source encodes hierarchy implicitly inside one polymorphic collection. Every loader must branch on `type`, infer brand family from `product_family` / `marketing_brand`, and resolve IPL refs against a missing `assets` collection — multiplying transform rules and reconciliation surfaces.

---

## Workflow semantics (sync / review / approved / deleted)

Confluence documents cataloger flags: **sync** (scheduled for sync), **review** (QA queue), **approved** (ready for downstream), **deleted** (soft delete). In BSON, workflow lives under `meta.approved`, `meta.deleted`, `meta.review`; top-level `sync` is rarely populated on sampled paths.

Measured on **5,142,183** product docs:

- `meta.approved=true`: **5,115,638** (99.5%)
- `meta.approved` false/missing: **26,545**
- `meta.deleted=true`: **438,979** (8.5%)

**Transform impact:** ~8.5% of catalog rows are soft-deleted but still present in the master dump. Shopware publication policy must explicitly choose skip vs inactive load. Unapproved rows (26,545) cannot reach storefront without overriding Confluence's approval contract.

---

## Stock / inventory join complexity

Parts reference stock via `products.stock` → `inventory.source`. Join metrics on full corpus:

| Outcome | Count |
|---------|------:|
| Join OK | 4,168,881 |
| Empty `products.stock` | 973,287 (20.4% of parts) |
| Stock ref missing in inventory | 15 |

Inventory collection (**3,626,867** docs):

- `quantity_on_hand` missing: **2,735,879** (75.4%)
- `availability=nla`: **2,571,968** (no longer available — storefront semantics differ from qty=0)
- Unparseable price: **3,670**

**Schema difficulty:** Shopware product stock is a scalar on the product entity; source splits sellable identity (`products.source`) from fulfillment identity (`inventory.source`). Multiple part SKUs can share one stock row (Confluence: brand-name variants). Empty stock on ~20.4% of parts forces a policy default (zero vs skip) that affects salability and search facets.

---

## IPL / media / assets gap

- **4,622,287** product docs have empty `photos[]` (89.9%).
- Parts with non-empty `photos[]` reference asset IDs, but **assets.bson is absent** in the sample archive (no assets.bson; only assets_staging_incremental_*.metadata.json stubs).
- 81 `assets_staging_incremental_*.metadata.json` stubs exist without BSON payload.

Confluence specifies IPL custom entity plugin and CDN-backed media. Without `assets` join path, **every part with photo refs blocks media resolution** — observed ~20% block rate on 10k-part transform sample when policy requires assets.

**Scale implication:** At ~5.1M product docs, even a minority with photos implies hundreds of thousands of media operations once assets exist — requiring idempotent Admin API media upserts and CDN URL contract from client.

---

## Brand / equipment type sparsity

- `equipment_type` empty on **4,784,435** docs (93.0%).
- Brand family is often inferred, not normalized (overview § Brand Family).

Shopware category SEO and equipment-type landing pages (Confluence Brand Equipment Type Page) need stable category keys; sparse equipment metadata increases manual mapping or ML inference cost.

---

## Scale and migration throughput

| Collection | Documents | On-disk size |
|------------|----------:|-------------:|
| products | 5,142,183 | NaN GB |
| inventory | 3,626,867 | NaN GB |

A naïve full-document EventBridge payload at ~1KB/detail would exceed practical bus limits; compact ID-only events (Confluence EventBridge design) require fetch-on-process and idempotent upsert — mandatory at this scale.

---

## Client-only verdict

The BSON sample is sufficient to measure shape, cardinality, and join health for **parts + inventory**. It is **insufficient** to validate IPL diagram loading, media CDN resolution, or live change-stream behavior — those require `assets.bson`, Shopware staging credentials, and DocumentDB change stream access from the client environment.

---

## Self-service refresh (2026-06-04)

| Check | Result |
|-------|--------|
| Intent rollup | 1 PASS · 5 PARTIAL · 7 GAP · 2 INCONCLUSIVE |
| Transform sample success | 71.6% (7,879 / 11,000) — error rate **28.37%** (unchanged vs prior dry-run) |
| Top delay drivers | OD-01 (~20w est.), hierarchy collapse (~20w), EventBridge scale (12w) — [blocker-delay-matrix.tsv](blocker-delay-matrix.tsv) |

Consolidated metrics and checksums: [analysis-findings-report.md](analysis-findings-report.md).

