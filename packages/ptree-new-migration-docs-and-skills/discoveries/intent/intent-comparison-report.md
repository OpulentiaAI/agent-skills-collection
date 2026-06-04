# Intent comparison report

**Profile:** opulent-sample-bson-2026-06-02 · **Profile generated:** 2026-06-04T01:17:16 · **Report generated:** 2026-06-04  
**Transform sample:** `transform_stats.json` (2026-06-04T01:15:58) · 11,000 rows (10,000 parts + 1,000 models)

## Summary

| Status | Count |
|--------|------:|
| PASS | 1 |
| PARTIAL | 5 |
| GAP | 7 |
| INCONCLUSIVE | 2 |

## Per-intent

### INT-001 — Shopware hierarchy navigation
- **Statement:** Shopware exposes Brand→Family→Model→Variant→IPL→Parts navigation matching the Confluence merchandise tree.
- **Confluence:** Catalog hierarchy / six-level tree (`Confluence-PTREE-010626-130110.pdf`; `report-sections/01-confluence-target-state.md` — phased loader order Brand→Family→Model→Variant→IPL→Parts).
- **Metric:** `hierarchy_collections_present` = false; `product_document_count` = 5,142,183; `equipment_type_empty_rate` = 4,784,435 / 5,142,183 (93.0%)
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.brands_models_ipls`, `source_profile.json#catalog_zip_bson_members`, `segment-findings/brands_on_products.md`
- **Notes:** Archive contains only `products.bson`, `inventory.bson`, `accounts.bson` — no separate brand/model/IPL collections. Brand encoded as embedded arrays (`marketing_brand`, `manufacturing_brand`); hierarchy must be derived via mapping contract. OD-01 blocks model placement.

### INT-002 — IPL custom entity loading
- **Statement:** IPL diagrams load via PartsTreeIplPlugin with diagram metadata and product associations.
- **Confluence:** IPL diagrams / PartsTreeIplPlugin (`01-confluence-target-state.md` — custom entity `ipl`, join tables, diagram assets).
- **Metric:** `products_with_ipl_field_count` = 355,939; `assets_collection_present` = false (`collections_present.assets.status` = missing, `document_count` = 0)
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.assets`, `source_profile.json#collections_present.brands_models_ipls.products_with_ipl_field`, `segment-findings/media_ipl.md`, `segment-findings/products_models.md`
- **Notes:** 355,939 products carry `ipl[]` string refs; `assets.bson` absent (81 metadata stubs only). Refs are not loadable IPL entities without assets export and plugin contract.

### INT-003 — Product media via Catalog assets → CDN
- **Statement:** Product media resolves through the assets collection to CDN URLs on sellable parts.
- **Confluence:** Media and CDN contract (`01-confluence-target-state.md` — assets → Shopware media entity, `CDN_BASE_URL`).
- **Metric:** `assets_collection_present` = false; `photos_empty_rate` = 4,622,287 / 5,142,183 (89.9%); `parts_blocked_no_media_rate_sample` = 2,065 / 10,000 (20.65%); `CDN_BASE` = null
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.assets`, `source_profile.json#collections_present.products.workflow_flags.photos_empty`, `transform_stats.json#policies.CDN_BASE`, `segment-findings/media_ipl.md`, `segment-findings/products_parts.md`
- **Notes:** 519,896 products have non-empty `photos[]` refs, but assets BSON and CDN base are absent — cannot verify join or URL materialization. Transform blocks 20.65% of part sample at require-media policy.

### INT-004 — Cataloger workflow gates drive ETL
- **Statement:** sync/review/approved/deleted semantics gate publication in CRON ETL and EventBridge sync.
- **Confluence:** Cataloger workflow table (`01-confluence-target-state.md` / PDF — four flags gating CRON and EventBridge).
- **Metric:** `meta_unapproved_product_count` = 26,545; `meta_deleted_product_rate` = 438,979 / 5,142,183 (8.5%)
- **Status:** PARTIAL
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.products.workflow_flags`, `source_profile.json#intent_alignment_notes`, `segment-findings/workflow_meta.md`
- **Notes:** BSON encodes gating under `meta.approved`, `meta.deleted`, `meta.review`; top-level `sync` rarely present on sampled paths. Explicit `meta.*` → publication field map incomplete (SDB-meta-map / OD-17).

### INT-005 — Compact EventBridge events at scale
- **Statement:** Ongoing sync uses ID-only compact events, not full BSON documents on the bus, at 5M+ product scale.
- **Confluence:** Baseline ETL vs ongoing sync (`01-confluence-target-state.md` — ~256 KB EventBridge limit, 5M+ scale).
- **Metric:** `product_document_count` = 5,142,183; SAM template at `discoveries/assessment/infrastructure/eventbridge/template.yaml` (design artifact)
- **Status:** PARTIAL
- **Confidence:** medium
- **Evidence:** `source_profile.json#collections_present.products.document_count`, `notes/evidence_index.md` (EventBridge IaC), `discoveries/blockers/blocker-delay-narrative.md` (DISC-010 scale risk)
- **Notes:** Template exists; static BSON archive cannot prove runtime payload sizes, ledger behavior, or bus throughput at 5.1M scale.

### INT-006 — Deterministic target IDs from source keys
- **Statement:** Stable UUID per `products.source` / `inventory.source` across retries and re-runs.
- **Confluence:** Shopware MVP identity (`01-confluence-target-state.md` — 32-char hex from source keys).
- **Metric:** `transform_sample_success_rate` = 7,879 / 11,000; G4 payload hash ledger incomplete (no verified `payload_hash_ledger.sqlite`)
- **Status:** PARTIAL
- **Confidence:** medium
- **Evidence:** `transform_stats.json#transform.success`, `discoveries/assessment/output/shopware_payload_sample.jsonl`, `discoveries/blockers/blocker-delay-narrative.md` (DISC-009 G4 without hash ledger)
- **Notes:** Assessment mapper emits deterministic IDs in sample payloads; G4 gate lacks hash-ledger verification on target read-back.

### INT-007 — Part price/stock from inventory join
- **Statement:** Fewer than 1% of parts have empty stock without an explicit policy override.
- **Confluence:** Stock join (`01-confluence-target-state.md` — `products.stock` → `inventory.source`).
- **Metric:** `parts_with_empty_stock_rate` = 973,287 / 4,759,440 (20.4%); `product_stock_missing_inventory_count` = 15
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#join_metrics.products_stock_to_inventory_source`, `source_profile.json#collections_present.products.workflow_flags.stock_empty`, `segment-findings/stock_joins.md`, `segment-findings/products_parts.md`
- **Notes:** Dominant gap is missing `stock` on parts (973,287), not orphan inventory refs (15). `STOCK_FALLBACK=zero` used 1,054 times in 11k sample — masks join gaps in success metrics.

### INT-008 — custom_ prefix parity across envs
- **Statement:** Custom fields use `custom_` prefix with dev/stage/prod schema parity.
- **Confluence:** Custom fields pages 61–65 (`01-confluence-target-state.md` — 30+ fields, G3 gate).
- **Metric:** Local schema bundle only (`discoveries/assessment/schemas/`); no OAuth smoke or env diff in profile
- **Status:** INCONCLUSIVE
- **Confidence:** low
- **Evidence:** `discoveries/assessment/schemas/`; `notes/evidence_index.md`; no live Shopware credentials in sample archive
- **Notes:** Schemas exist locally; cannot verify deployed field parity across environments without OAuth smoke test.

### INT-009 — DocumentDB change streams → Shopware
- **Statement:** Change streams with resume tokens and reconciler feed continuous sync to Shopware.
- **Confluence:** Ongoing sync / DynamoDB ledger (`01-confluence-target-state.md` — change-stream processor, resume tokens).
- **Metric:** `profile_verdict` = MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE; static BSON archive only
- **Status:** INCONCLUSIVE
- **Confidence:** low
- **Evidence:** `source_profile.json#profile_verdict`, `source_profile.json#source_environment`, `segment-findings/workflow_meta.md`
- **Notes:** Sample zip cannot measure stream retention, resume tokens, drift, or reconciler behavior against live DocumentDB.

### INT-010 — CRON/load skips deleted and unapproved
- **Statement:** Zero salable deleted rows reach storefront without explicit policy override.
- **Confluence:** CRON ETL gating (`01-confluence-target-state.md` — approved + deleted checks before load).
- **Metric:** `meta_deleted_product_rate` = 438,979 / 5,142,183 (8.5%); transform `skipped_deleted` = 77 / 11,000; `skipped_unapproved` = 0; `PUBLICATION_POLICY` = skip
- **Status:** PARTIAL
- **Confidence:** high
- **Evidence:** `transform_stats.json#transform.skipped_deleted`, `transform_stats.json#policies.PUBLICATION_POLICY`, `source_profile.json#collections_present.products.workflow_flags`, `segment-findings/workflow_meta.md`
- **Notes:** Skip policy works in 11k dry-run sample; 438,979 deleted products remain in source dump. OD-06 publication semantics unsigned (`skip` vs `load_inactive`).

### INT-011 — ~4.4M part products migrate
- **Statement:** At least ~4.4M part products are profiled and in migration scope.
- **Confluence:** Scale assumptions (`01-confluence-target-state.md` — ~4.4M parts planning figure).
- **Metric:** `part_document_count` = 4,759,440
- **Status:** PASS
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.products.type_distribution.part`, `segment-findings/products_parts.md`
- **Notes:** Measured count exceeds Confluence planning figure. PASS is cardinality only — not load readiness (20.4% empty stock, 28.4% transform sample blocks remain).

### INT-012 — Inventory rows align to stock refs
- **Statement:** Join health exceeds 99% between product stock refs and inventory rows.
- **Confluence:** Stock join health (`01-confluence-target-state.md` — inventory alignment for price/qty).
- **Metric:** `product_stock_join_ok_count` = 4,168,881 / 5,142,183 (81.1%); `product_stock_empty` = 973,287; `inventory_document_count` = 3,626,867
- **Status:** PARTIAL
- **Confidence:** high
- **Evidence:** `source_profile.json#join_metrics`, `source_profile.json#join_metrics.inventory_source_distinct_count`, `segment-findings/stock_joins.md`, `segment-findings/inventory.md`
- **Notes:** 4.17M refs resolve when present; 973,287 products have empty `stock`. Orphan refs only 15. Join_ok denominator includes models; part-level empty stock still fails business intent (INT-007 GAP).

### INT-013 — Production source freeze before cutover
- **Statement:** Profile verdict is PRODUCTION_FREEZE before cutover sign-off.
- **Confluence:** MVP boundaries (`01-confluence-target-state.md` — production manifest gate).
- **Metric:** `profile_verdict` = MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#profile_verdict`, `source_profile.json#source_environment` (sample_archive_not_live_documentdb), `segment-findings/workflow_meta.md`, `segment-findings/brands_on_products.md`
- **Notes:** Sample archive SHA256 recorded; not a signed production DocumentDB freeze. OD-16 open.

### INT-014 — Model→Shopware mapping decided (OD-01)
- **Statement:** Model mapping block rate near 0% after Option 1 or Option 2 decision.
- **Confluence:** Option 1 vs Option 2 (`01-confluence-target-state.md` — OD-01, category vs custom entity).
- **Metric:** `model_mapping_block_rate_sample` = 923 / 1,000 (92.3%); `model_document_count` = 382,743; `OD01_DECISION` = UNDECIDED
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `transform_stats.json#transform.blocked_model_mapping`, `transform_stats.json#policies.OD01_DECISION`, `segment-findings/products_models.md`
- **Notes:** Full-corpus dry-run grouping estimates 141,758 blocked models (not a linear extrapolation of 92.3% sample rate). Human Domain Owner decision required — skill surfaces GAP only.

### INT-015 — Attributes collection in scope
- **Statement:** `attributes.bson` is present and profiled for migration scope.
- **Confluence:** Attributes/metadata in catalog scope (semantic-layer intent registry; Confluence custom-field context pages 61–65).
- **Metric:** `attributes` collection status = missing (`collections_present.attributes.bson` = null)
- **Status:** GAP
- **Confidence:** high
- **Evidence:** `source_profile.json#collections_present.attributes`, `source_profile.json#catalog_zip_bson_members`
- **Notes:** No attributes BSON in sample zip (`agent-skills-collection/docs/input-sample-data.zip`). Attribute-heavy Shopware field mapping unverified.

## Executive Q&A (selected)

> **Q:** Does the archive support IPL plugin loading?  
> **Metric:** `assets_collection_present` = false, `products_with_ipl_field_count` = 355,939  
> **A:** Intent INT-002 is **GAP** — IPL refs exist; assets BSON absent.

> **Q:** Does measured part volume meet Confluence scale?  
> **Metric:** `part_document_count` = 4,759,440  
> **A:** Intent INT-011 is **PASS** — exceeds ~4.4M planning figure; load readiness separate.

> **Q:** Is production source frozen for cutover?  
> **Metric:** `profile_verdict` = MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE  
> **A:** Intent INT-013 is **GAP** — sample archive only (OD-16).

## Adversarial pass (PASS / PARTIAL misleading modes)

| Intent | Risk if trusted naively |
|--------|-------------------------|
| INT-011 PASS | Part count OK but 20.4% empty stock + 28.4% transform sample blocks still prevent storefront parity. |
| INT-004 PARTIAL | `meta.*` fields exist but EventBridge processor could bypass CRON skip rules without contract tests. |
| INT-005 PARTIAL | SAM template exists; implementation could still emit full-document events at 5.1M scale. |
| INT-006 PARTIAL | Deterministic IDs in dry-run code ≠ G4 hash ledger verified on target read-back. |
| INT-010 PARTIAL | Sample `PUBLICATION_POLICY=skip` ≠ production handling of 438,979 deleted rows without OD-06 sign-off. |
| INT-012 PARTIAL | 81.1% join_ok includes models; 973,287 empty-stock products fail the >99% intent bar and INT-007 business rule. |

## Escalations

- **INT-001, INT-014:** OD-01 Option 1 vs 2 — Human Domain Owner (model→category vs custom entity).
- **INT-002, INT-003:** `assets.bson` + `CDN_BASE_URL` — Media/IPL Contract Agent; client export deliverable.
- **INT-004, INT-010:** OD-06 publication policy for 438,979 deleted and 26,545 unapproved products.
- **INT-007, INT-012:** OD-04/OD-05 stock/qty fallback for 973,287 empty-stock parts and 2,735,879 missing qty rows.
- **INT-008:** G3 target schema OAuth smoke — Shopware Target Agent.
- **INT-013:** OD-16 production freeze vs sample archive boundary.
- **INT-015:** Client deliverable for `attributes.bson` — scope confirmation.

## Provenance

Source: semantic-layer intent registry · Profile: `source_profile.json` (opulent-sample-bson-2026-06-02, generated_at 2026-06-04T01:17:16) · Transform: `discoveries/assessment/output/transform_stats.json` (generated_at 2026-06-04T01:15:58) · Segments: `discoveries/segments/*.md` · Skill: ptree-intent-comparison-analyst
