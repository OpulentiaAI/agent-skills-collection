# Segment: stock_joins

## Question
How healthy is the `products.stock` → `inventory.source` join on the measured BSON profile, and does the dry-run transform sample (`STOCK_FALLBACK=zero`) mask empty-stock gaps?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `product_stock_join_ok_count` | 4,168,881 / 5,142,183 (81.1%) | product doc |
| `product_stock_missing_inventory_count` | 15 / 5,142,183 | product doc |
| `parts_with_empty_stock_rate` | 973,287 / 4,759,440 (20.4%) | part |
| `stock_fallback_used_count_sample` | 1,054 / 11,000 (9.6%) | sample row |
| `transform_sample_error_rate` | 0.2837 (28.4%) | sample row |

## Observations
- `join_metrics.products_stock_to_inventory_source`: join_ok **4,168,881** · empty stock **973,287** · orphan inventory refs **15** — sums to **5,142,183** products (`source_profile.json`).
- Empty stock count matches `collections_present.products.workflow_flags.stock_empty` **973,287**; as a part rate **973,287 / 4,759,440 = 20.4%** (`type_distribution.part`).
- Join OK on full product corpus: **81.1%** (4,168,881 / 5,142,183); semantic-layer intent **INT-012** threshold is join health **>99%** — **not met**.
- Orphan refs: **15** products cite `stock` values with no matching `inventory.source` row — low volume, high reconciliation severity.
- `inventory_source_distinct_count` **3,626,867** vs **3,626,867** inventory docs — inventory side is complete; gaps are on product `stock` empties and rare orphans, not missing inventory collection.
- `transform_stats.json` (11,000 sample rows): `stock_fallback_used` **1,054** with `STOCK_FALLBACK` = **zero**; `blocked_stock_missing_ref` **0**; `blocked_inventory_missing` **0**.
- Fallback rate in sample: **1,054 / 11,000 ≈ 9.6%** of transform input rows used zero-stock fallback instead of blocking.
- Overall sample `error_rate` **0.2837** — dominated by `blocked_no_media` (2,065) and `blocked_model_mapping` (923), not stock blockers.

## Interpretations
- Stock join is **partially healthy** for rows that carry a ref: **4.17M** resolve; the dominant catalog gap is **missing `stock` on parts** (973k), not widespread orphan inventory.
- **INT-012 PARTIAL:** measured join_ok rate **81.1%** fails the **>99%** intent bar because empty-stock products are counted outside join_ok, not because inventory rows are missing en masse.
- **INT-007 GAP:** **20.4%** of parts lack a stock ref — intent expects **<1%** empty stock without an explicit policy.
- `STOCK_FALLBACK=zero` lets the dry-run emit salable rows with qty **0** rather than `blocked_stock_missing_ref` — **masks** empty-stock policy debate; any sample success-rate claim must disclose fallback (skill gotcha).
- The **15** orphan refs need mapping-contract / DQ treatment before loaders; they are not addressed by zero fallback.

## Blockers
- **OD-04 / OD-05:** Empty stock and missing qty semantics require a signed fallback (block, zero, or alternate source) before Batch D loaders.
- **SDB-stock-empty:** **973,287** parts without `stock` ref — Mapping Contract Agent (week 2–4).
- **SDB-stock-orphan:** **15** orphan `stock` → `inventory.source` mismatches — reconcile or quarantine before load.
- Process: **28.4%** sample error rate includes non-stock blockers; stock-specific policy still hides **973k** corpus gaps via fallback in sample.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · transform_stats.json (2026-06-04) · Segment: stock_joins · Skill: ptree-segment-data-analyst
