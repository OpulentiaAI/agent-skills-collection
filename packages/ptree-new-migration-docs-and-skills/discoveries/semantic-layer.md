# PartsTree migration semantic layer

Governed **metrics**, **segments**, and **plan intents** for analysis. Use this file before ad-hoc BSON queries or invented percentages.

**Profile freeze:** `source_profile.json` (`profile_id: opulent-sample-bson-2026-06-02`, verdict `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE`).

Companion: `notes/guides/analysis-self-service-guide.md` · Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`

---

## How to use

1. Look up metric or segment here; read values from `source_profile.json`.
2. Re-profile or dry-run only when refreshing ground truth — document new metrics in the same change.
3. Cite metric **names** in prose; keep a short evidence ledger for Confluence ↔ data links.

---

## Segments

| Segment ID | Scope | BSON / path | Notes |
|------------|-------|-------------|-------|
| `products_parts` | Part SKU | `products.bson`, `type=part` | Salability metrics may exclude `meta.deleted` per metric note |
| `products_models` | Equipment model | `products.bson`, `type=model` | OD-01 mapping friction |
| `inventory` | Stock row | `inventory.bson` | Join on `inventory.source` |
| `workflow_meta` | Approval/deletion | `meta.*`, rare top-level `sync` | Map to Confluence cataloger workflow |
| `stock_joins` | Part ↔ inventory | `products.stock` → `inventory.source` | Do not mix part/model denominators |
| `media_ipl` | Photos, IPL, assets | `ipl`, `photos[]`, `assets.bson` | Missing assets = absence, not zero |
| `brands_on_products` | Brand/hierarchy signals | `marketing_brand`, `equipment_type`, etc. | Single polymorphic `products` collection |

---

## Metrics catalog

| Metric | Definition | Numerator / denominator | Grain | Limitations |
|--------|------------|-------------------------|-------|-------------|
| `product_document_count` | All products BSON rows | 5,142,183 / — | product doc | Includes deleted/unapproved |
| `part_document_count` | Parts only | 4,759,440 / `product_document_count` | part doc | — |
| `model_document_count` | Models only | 382,743 / `product_document_count` | model doc | — |
| `inventory_document_count` | Inventory rows | 3,626,867 / — | inventory doc | — |
| `parts_with_empty_stock_rate` | Parts with no `stock` ref | 973,287 / 4,759,440 | part | ~20.4% of parts |
| `product_stock_join_ok_count` | Stock ref resolves | 4,168,881 / 5,142,183 | product doc | Includes models |
| `product_stock_missing_inventory_count` | Orphan stock refs | 15 / 5,142,183 | product doc | — |
| `inventory_qty_on_hand_missing_rate` | Missing `quantity_on_hand` | 2,735,879 / 3,626,867 | inventory doc | NLA often null qty |
| `inventory_nla_share` | `availability=nla` | 2,571,968 / 3,626,867 | inventory doc | ≠ Shopware qty 0 |
| `inventory_price_unparseable_count` | Price parser failures | 3,670 / 3,626,867 | inventory doc | Aligns with dry-run DQ |
| `meta_deleted_product_rate` | `meta.deleted=true` | 438,979 / 5,142,183 | product doc | Still in dump |
| `meta_unapproved_product_count` | Not approved | 26,545 / 5,142,183 | product doc | Publication policy (OD-06) |
| `photos_empty_rate` | Empty `photos[]` | 4,622,287 / 5,142,183 | product doc | Does not prove assets exist |
| `products_with_ipl_field_count` | Docs with `ipl` | 355,939 / 5,142,183 | product doc | ≠ loadable IPL entity |
| `equipment_type_empty_rate` | Missing equipment type | 4,784,435 / 5,142,183 | product doc | ~93% empty |
| `assets_collection_present` | `assets.bson` in archive | false | archive | Blocks media/IPL verification |
| `assets_metadata_stub_count` | Staging stubs | 81 / — | archive | Incremental pipeline signal |
| `transform_sample_success_rate` | Dry-run successes | 7,879 / 11,000 | sample row | Not full corpus |
| `transform_sample_error_rate` | Dry-run errors | 0.2837 | sample row | OD01, CDN null, etc. |
| `model_mapping_block_rate_sample` | Models blocked (OD-01) | 923 / 1,000 | model sample | **92.3%** of model sample |
| `model_mapping_block_count_est_full` | Extrapolated blocked models | 141,758 / 382,743 | model doc | Needs OD-01 decision |
| `parts_blocked_no_media_rate_sample` | Parts blocked (no media) | 2,065 / 10,000 | part sample | **20.65%** at require-media |
| `stock_fallback_used_count_sample` | STOCK_FALLBACK=zero | 1,054 / 11,000 | sample row | Masks join gaps in sample |
| `hierarchy_collections_present` | Separate hierarchy collections | false | catalog | Polymorphic `products` only |

### Refresh commands

```bash
python agent/scripts/profile_source_bson.py
# → discoveries/profiles/source_profile.json

node discoveries/assessment/scripts/run_transform_dry_run.mjs
# → discoveries/assessment/output/transform_stats.json
```

---

## Intent registry

Plain statements from Confluence / client plan, tested against **current sample** (not gate automation).

| ID | Intent | Verification | Status | Evidence hint |
|----|--------|--------------|--------|---------------|
| INT-001 | Brand→Family→Model→Variant→IPL→Parts navigation in Shopware | `hierarchy_collections_present`, mapping | **GAP** | Single `products` collection; OD-01 open |
| INT-002 | IPL via PartsTreeIplPlugin custom entity | `products_with_ipl_field_count`, `assets_collection_present` | **GAP** | IPL refs; no `assets.bson` |
| INT-003 | Media via Catalog assets → CDN → Shopware | `assets_collection_present`, `photos_empty_rate` | **GAP** | ~89.9% empty photos |
| INT-004 | Cataloger workflow drives ETL | `meta_unapproved_product_count`, `meta_deleted_product_rate` | **PARTIAL** | Semantics in `meta.*` |
| INT-005 | Ongoing sync uses compact events | Event template + scale | **PARTIAL** | 5.1M doc scale risk |
| INT-006 | Deterministic target IDs from source keys | dry-run payload keys | **PARTIAL** | Mapper exists; ledger incomplete |
| INT-007 | Price/stock from inventory join | `parts_with_empty_stock_rate`, orphans | **GAP** | 20.4% empty stock |
| INT-008 | `custom_` fields parity across envs | target schema bundle | **INCONCLUSIVE** | No OAuth smoke |
| INT-009 | Change streams feed Shopware | stream + ledger design | **INCONCLUSIVE** | Static BSON sample |
| INT-010 | Load skips deleted/unapproved | `meta_deleted_product_rate`, dry-run skips | **PARTIAL** | Policy in dry-run |
| INT-011 | ~4.4M parts migrate | `part_document_count` | **PASS** | 4,759,440 measured |
| INT-012 | Inventory aligns to stock refs | `product_stock_join_ok_count` | **PARTIAL** | Many empty stock refs |
| INT-013 | Production source freeze before cutover | `profile_verdict` | **GAP** | Sample only |
| INT-014 | Model→Shopware mapping decided | `model_mapping_block_rate_sample` | **GAP** | OD-01 UNDECIDED |
| INT-015 | Attributes collection in scope | attributes in profile | **GAP** | Missing in sample |

**Status:** PASS = sample supports intent; PARTIAL = direction right, contract incomplete; GAP = fails on sample; INCONCLUSIVE = needs live env or deliverable.

---

## Human decisions (not guessed here)

Publication/deleted policy (OD-06), OD-01 Option 1 vs 2, production vs sample boundary (OD-16), CDN/Shopware credentials, cutover sign-off. Collect metric evidence first; use `human-escalation-judgment` before irreversible steps.

---

## Maintenance

Update metrics when `source_profile.json` or `transform_stats.json` is regenerated. Add intents when Confluence changes; cite PDF section in the PR.
