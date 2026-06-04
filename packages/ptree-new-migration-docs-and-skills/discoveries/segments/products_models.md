# Segment: products_models

## Question
How many equipment models exist in BSON, how are IPL refs distributed across products, and what does the transform sample show for OD-01 mapping blocks?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `model_document_count` | 382,743 | model doc |
| `products_with_ipl_field_count` | 355,939 / 5,142,183 | product doc |
| `model_mapping_block_rate_sample` | 923 / 1,000 (92.3%) | model sample |
| `model_mapping_block_count_est_full` | 141,758 / 382,743 | model doc (est.) |
| `hierarchy_collections_present` | false | catalog |

## Observations
- `collections_present.products.type_distribution.model` = **382,743** of **5,142,183** product documents (`source_profile.json`).
- `collections_present.products.workflow_flags.ipl_field_present` = **355,939**; `brands_models_ipls.products_with_ipl_field` matches (**355,939**). Grain is all products, not models-only.
- No separate `models` or `ipls` collections; hierarchy encoded in polymorphic `products.bson` (`brands_models_ipls.notes`).
- `transform_stats.json`: `sample_limits.models` = **1,000**; `transform.blocked_model_mapping` = **923**; `policies.OD01_DECISION` = **UNDECIDED**.
- Full-corpus extrapolation: `dry-run-groups.csv` row `models_to_shopware_categories` shows **141,758** blocked of **382,743** model candidates (240,985 loadable under `approved=true, deleted=false, model/category mapping frozen`).
- `profile_verdict` = **MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE** (INT-013 GAP).

## Interpretations
- Model scale (**382,743**) exceeds Confluence planning assumptions (~300K) but remains measurable; loadability depends on OD-01 (Option 1 categories vs Option 2 custom entity).
- **355,939** products carry `ipl[]` string refs; presence does not prove loadable IPL entities without `assets.bson` and `PartsTreeIplPlugin` contract (INT-002 GAP).
- **92.3%** sample block rate under `OD01_DECISION=UNDECIDED` means transform emits `blocked_od01_mapping` / `UNDECIDED_OD01` for nearly all sampled models; category/model loaders cannot proceed without `mapping_approval_record.md` (G2, INT-014 GAP).
- Full-corpus **141,758** blocked (~37.0% of model population) reflects combined approval/deletion/mapping gates in dry-run grouping—not a direct linear extrapolation of the 92.3% sample rate alone.

## Blockers
- **OD-01 UNDECIDED:** `transform_stats.json#policies.OD01_DECISION` blocks model→category vs custom-entity mapping (INT-014 GAP).
- **SDB-assets-missing:** IPL diagram assets not joinable in sample archive (`assets_collection_present=false`).
- **141,758** models `BLOCKED_PENDING_OD-01` at full corpus per `dry-run-groups.csv`.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · Segment: products_models · Skill: ptree-segment-data-analyst
