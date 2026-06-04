# Segment: products_parts

## Question
What is the measured shape of part SKUs (`catalog/products.bson`, `type=part`) in the sample archive, and which stock, media, workflow, and dry-run transform risks affect part migration scale and salability?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `part_document_count` | 4,759,440 / 5,142,183 | part doc |
| `parts_with_empty_stock_rate` | 973,287 / 4,759,440 (20.4%) | part |
| `photos_empty_rate` | 4,622,287 / 5,142,183 (89.9%) | product doc |
| `meta_deleted_product_rate` | 438,979 / 5,142,183 (8.5%) | product doc |
| `transform_sample_success_rate` | 7,879 / 11,000 | sample row |
| `parts_blocked_no_media_rate_sample` | 2,065 / 10,000 (20.65%) | part sample |

## Observations
- **Part cardinality:** `collections_present.products.type_distribution.part` = **4,759,440** of **5,142,183** product docs (`source_profile.json`); matches `brands_models_ipls.products_type_distribution.part`.
- **Empty stock:** `workflow_flags.stock_empty` = **973,287**; `join_metrics.products_stock_to_inventory_source.product_stock_empty` = **973,287** (same numerator as `parts_with_empty_stock_rate` denominator scope for parts).
- **Photos:** `workflow_flags.photos_empty` = **4,622,287** on all products (not part-only); rate uses **5,142,183** product denominator per semantic layer.
- **Soft-delete:** `workflow_flags.meta.deleted_true` = **438,979** on products corpus; no part-only `meta.deleted` subset in this profile freeze.
- **Part shape (samples):** `record_samples` (type=part) show `meta.approved=true`, `meta.deleted=false`, non-empty `stock` matching inventory-style keys, `photos_len=0`, and `marketing_brand` / `manufacturing_brand` arrays (e.g. Snapper sources `ARIPS22PRT …`).
- **Transform dry-run:** `transform_stats.json` → `transform.success` = **7,879** / `input_rows` **11,000**; `blocked_no_media` = **2,065** on **10,000**-part sample (`sample_limits.parts`); `stock_fallback_used` = **1,054**; policies `CDN_BASE` = **null**, `STOCK_FALLBACK` = **zero**, `PUBLICATION_POLICY` = **skip**.
- **Archive boundary:** `profile_verdict` = **MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE**; `assets.status` = **missing** (no `assets.bson`).

## Interpretations
- **INT-011 PASS:** Measured **4,759,440** parts exceeds Confluence planning figure (~4.4M+); scale is profiled, not blocked by part count.
- **INT-007 GAP:** **20.4%** of parts lack a `stock` ref; empty stock is a join/data condition, not soft-delete (OD-06 is separate).
- **INT-003 GAP:** Corpus **89.9%** `photos_empty` plus absent `assets.bson` drives **20.65%** part-sample blocks under require-media policy when `CDN_BASE` is null.
- **INT-010 PARTIAL:** **8.5%** `meta.deleted` products remain in master dump; dry-run skipped **77** deleted rows in the 11k sample — publication rules must align before loaders.
- Sample transform success (**7,879 / 11,000**) is not full-corpus throughput; model-mapping and media blocks dominate sample `error_rate` **0.2837**.

## Blockers
- **SDB-assets-missing:** `collections_present.assets.status` = missing — blocks CDN/media resolution for parts with non-empty `photos[]`.
- **OD-06:** **438,979** deleted and **26,545** unapproved products (`meta.approved_false_or_missing`) need signed publication semantics before salable part load.
- **OD-04/OD-05:** `STOCK_FALLBACK=zero` applied **1,054** times in sample — masks empty-stock join gaps in dry-run only.
- **OD-16 / INT-013:** Sample archive is not a production DocumentDB freeze.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02, generated_at 2026-06-04T01:17:16) · transform_stats.json (generated_at 2026-06-04T01:15:58) · Segment: products_parts · Skill: ptree-segment-data-analyst
