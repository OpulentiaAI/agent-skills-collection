# Blocker / delay narrative (nine-month vs three-month)

**Profile:** opulent-sample-bson-2026-06-02 · **Generated:** 2026-06-04  
**Evidence:** `source_profile.json`, `transform_stats.json`, [../segments/](../segments/), [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md), [../../notes/post-mortem/ptree-migration-postmortem-report.md](../../notes/post-mortem/ptree-migration-postmortem-report.md) § Executive Summary + §8 twelve-week calendar.

Cross-analysis index: [analysis-findings-report.md](analysis-findings-report.md) · [client-data-gap-profile.md](client-data-gap-profile.md)

---

## 1. Architecture before measured source

**Theme:** Post-mortem root cause 1 — hierarchy and IPL design preceded BSON profiling (`CLI-001`, `IM-001`).

**Discoveries**

| ID | Client metric | Value |
|----|---------------|-------|
| DISC-007 | `hierarchy_collections_present` | false — no separate brands/models/IPL collections |
| DISC-007 | `equipment_type_empty_rate` | 93.0% (4,784,435 / 5,142,183) |
| DISC-013 | `products_with_ipl_field_count` | 355,939 with `ipl[]` refs, no joinable assets |
| DISC-016 | `part_document_count` | 4,759,440 (scale known; shape still polymorphic) |

**Nine-month pattern:** Confluence six-level tree and category loaders advanced while the archive delivered one `products.bson` (`part` + `model` discriminator). Brand lives in embedded arrays (`marketing_brand`, `product_family`), not normalized entities. Client hierarchy rework estimates **12–33 weeks**; consulting attribution **~20 weeks** — paid after transforms failed, not at week-1 profile. See [brands_on_products.md](../segments/brands_on_products.md), [products_models.md](../segments/products_models.md).

**Three-month prevention:** Week **1** Source Profile Agent emits `source_profile.json` with `hierarchy_collections_present=false` before Mapping Contract drafts tree rules. DISC-007 `week_in_3mo_plan=1`; delay estimate **20 weeks** if uncaught (post-mortem range).

---

## 2. Model mapping decision deferred (OD-01)

**Theme:** Post-mortem root cause 2 — Option 1 vs Option 2 never closed (`OD-01`, `IM-004`).

**Discoveries:** DISC-003 — `model_mapping_block_rate_sample` **92.3%** (923 / 1,000); full-corpus **141,758** models `BLOCKED_PENDING_OD-01`; `transform_stats.json#policies.OD01_DECISION=UNDECIDED`.

**Nine-month pattern:** Decision open months 2–7 while Lambdas and normalization churned; nearly every sampled model emits `blocked_od01_mapping` / `UNDECIDED_OD01`. G2 remained on an eleven-row starter CSV without `mapping_approval_record.md`.

**Three-month prevention:** Week **2** human decision point (same calendar as G2 mapping contract). Mapping Contract Agent cannot publish zero-blocker `mapping_contract.csv` until sign-off. DISC-003 `preventable=yes`, delay estimate **20 weeks** (inferred from nine-month deferral window).

Evidence: [products_models.md](../segments/products_models.md), [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md#INT-014).

---

## 3. Media / IPL without assets export

**Theme:** Post-mortem root cause 3 — media/IPL scope before signed assets export (`CLI-009–013`, `IM-002`).

**Discoveries**

| ID | Client metric | Value |
|----|---------------|-------|
| DISC-001 | `assets_collection_present` | false; `document_count=0`; 81 metadata stubs only |
| DISC-011 | `parts_blocked_no_media_rate_sample` | 20.65% (2,065 / 10,000) |
| DISC-011 | `CDN_BASE` in transform policies | null |
| DISC-013 | `photos_empty_rate` context | 89.9% empty; ~520K non-empty `photos[]` implied |

**Nine-month pattern:** No `assets.bson` in `catalog_zip_bson_members`; media/IPL loader groups show **zero** locally verifiable rows. Missing collection is **archive absence**, not proof production has no media — but it blocks G1 media/IPL verification and any CDN URL materialization.

**Three-month prevention:** Weeks **3–4** assets contract week — restore/defer in `source_snapshot_manifest.json` before Batch C normalization at scale; week **4** hard stop for Media/IPL Contract Agent deliverables (`media_ipl_contract.csv`, `cdn_resolution_report.csv`). DISC-001, DISC-011, DISC-013 `week_in_3mo_plan=4`.

Evidence: [media_ipl.md](../segments/media_ipl.md), [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md#INT-002).

---

## 4. Workflow / publication impedance (`meta.*`)

**Theme:** Post-mortem root cause 5 (publication contract) — `meta.*` flags vs Confluence top-level names (`OD-06`, `SDB-meta-map`).

**Discoveries:** DISC-004 — `meta_deleted_product_rate` **8.5%** (438,979 / 5,142,183); `meta_unapproved_product_count` **26,545**; Confluence `sync`/`review`/`approved`/`deleted` map to BSON `meta.approved`, `meta.deleted`, `meta.review`. DISC-014 — `attributes.bson` **missing** (INT-015 GAP).

**Nine-month pattern:** 438,979 soft-deleted rows remain in master dump; dry-run `skipped_deleted=77` in 11k sample proves skip policy works in code, not that OD-06 publication semantics are signed. Attributes-heavy Shopware fields unprofiled.

**Three-month prevention:** Week **2** OD-06 alongside OD-01; Mapping Contract Agent publishes explicit `meta.*` → publication map. Source Profile Agent flags missing `attributes` collection at week **1** (DISC-014).

Evidence: [workflow_meta.md](../segments/workflow_meta.md), [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md#INT-004).

---

## 5. Stock / inventory contracts open; code masked gaps

**Theme:** Post-mortem root cause 5 — inventory/publication contracts open while transforms masked gaps (`OD-04`, `OD-05`, `IM-010`).

**Discoveries**

| ID | Client metric | Value |
|----|---------------|-------|
| DISC-005 | `parts_with_empty_stock_rate` | 20.4% (973,287 / 4,759,440) |
| DISC-006 | `inventory_qty_on_hand_missing_rate` | 75.4% (2,735,879 / 3,626,867) |
| DISC-006 | `inventory_nla_share` | 70.9% — not equivalent to qty 0 without contract |
| DISC-012 | `inventory_price_unparseable_count` | 3,670 |
| DISC-015 | `stock_fallback_used_count_sample` | 1,054 with `STOCK_FALLBACK=zero` |
| DISC-017 | `product_stock_missing_inventory_count` | 15 orphan refs |

**Nine-month pattern:** `STOCK_FALLBACK=zero` inflated dry-run success (7,879 / 11,000) while **973k** parts lack `stock` refs; 2.74M inventory rows lack `quantity_on_hand`. INT-007 threshold is **<1%** empty stock — measured **20.4%** is a GAP, not a loader tuning issue.

**Three-month prevention:** Weeks **2–4** OD-04/OD-05 decisions; Mapping Contract + Data Quality Queue Agents before Inventory Loader (Batch D weeks **7–8**). DISC-005/006/015 `week_in_3mo_plan=2`; orphan refs (DISC-017) surface at profile week **2**.

Evidence: [stock_joins.md](../segments/stock_joins.md), [inventory.md](../segments/inventory.md), [products_parts.md](../segments/products_parts.md).

---

## 6. Transform / verification process gaps

**Theme:** Post-mortem root causes 4 and 5 — gates defined but not enforced; G4 summary-only (`IM-017`, `IM-018`, `IM-032`).

**Discoveries**

| ID | Metric | Value |
|----|--------|-------|
| DISC-008 | `transform_sample_error_rate` | 28.37% (3,121 blocked/skipped of 11,000) |
| DISC-008 | Dominant blockers | `blocked_no_media=2065`, `blocked_model_mapping=923` |
| DISC-009 | Hash ledger | `payload_hash_ledger.sqlite` not verified; G4 passed on presence alone |
| DISC-010 | Scale | 5,142,183 product docs — full-document EventBridge risk vs ~256 KB ceiling |

**Nine-month pattern:** 28.4% sample failure budget ignored; Batch D and EventBridge work continued while 24/26 agent roles correctly BLOCKED. Batch F scoped before baseline G5–G7 proof.

**Three-month prevention:** Weeks **5–6** Batch C — Normalization Harness + Independent Verification Agent; **no Batch D** until G4 `VERIFIED` with `dry_run_reconciliation.json`. Event Contract Agent paper design week **10**, implementation week **12** after G5–G7 (DISC-010).

Evidence: `transform_stats.json`, post-mortem §8 weeks 5–6 and 10–12.

---

## 7. Production freeze / vendor boundary

**Discoveries:** DISC-002 — `profile_verdict=MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` (INT-013 GAP, `OD-16`).

**Nine-month pattern:** Sample archive SHA treated as sufficient for loader progress; live DocumentDB change-stream behavior unmeasured (INT-009 INCONCLUSIVE).

**Three-month prevention:** Week **0** program reset — Access/Infra Agent + explicit OD-16 go/no-go on production source freeze date before G0 sign-off. DISC-002 `week_in_3mo_plan=0`, `blocker_type=vendor`.

Evidence: [workflow_meta.md](../segments/workflow_meta.md), [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md#INT-013).

---

## Preventable summary

| blocker_type | preventable=yes | preventable=partial | total DISC |
|--------------|------------------:|--------------------:|-----------:|
| data | 9 | 1 | 10 |
| schema | 3 | 0 | 3 |
| process | 2 | 0 | 2 |
| decision | 1 | 0 | 1 |
| vendor | 1 | 0 | 1 |

**16 of 17** discoveries marked `preventable=yes` or `partial` — Batch A–C self-service (semantic layer + segment findings + intent comparison) would surface them before Batch D loaders.

**Lead evidence rule:** Findings cite `assets_collection_present=false`, `parts_with_empty_stock_rate=20.4%`, `model_mapping_block_rate_sample=92.3%`, and `profile_verdict=MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` — not gate IDs alone.

---

## Segment and intent cross-links

| Segment finding | Primary DISC IDs | Intent gaps |
|-----------------|------------------|-------------|
| [brands_on_products.md](../segments/brands_on_products.md) | DISC-007 | INT-001 |
| [products_models.md](../segments/products_models.md) | DISC-003, DISC-013 | INT-002, INT-014 |
| [media_ipl.md](../segments/media_ipl.md) | DISC-001, DISC-011 | INT-002, INT-003 |
| [workflow_meta.md](../segments/workflow_meta.md) | DISC-002, DISC-004, DISC-014 | INT-004, INT-013, INT-015 |
| [stock_joins.md](../segments/stock_joins.md) | DISC-005, DISC-008, DISC-015, DISC-017 | INT-007, INT-010, INT-012 |
| [inventory.md](../segments/inventory.md) | DISC-006, DISC-012 | INT-007 |
| [products_parts.md](../segments/products_parts.md) | DISC-016 | INT-011 (PASS — scale only) |

---

## Provenance

Source: [../segments/](../segments/)/*.md · [../intent/intent-comparison-report.md](../intent/intent-comparison-report.md) · `discoveries/assessment/output/transform_stats.json` · [semantic-layer.md](../semantic-layer.md) · [../../notes/post-mortem/ptree-migration-postmortem-report.md](../../notes/post-mortem/ptree-migration-postmortem-report.md) §8 · Skill: `ptree-blocker-delay-mapper`
