# Segment: inventory

## Question
What is inventory row cardinality, availability semantics, and data-quality blockers for price/qty mapping to Shopware?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `inventory_document_count` | 3,626,867 | inventory doc |
| `inventory_qty_on_hand_missing_rate` | 2,735,879 / 3,626,867 (75.4%) | inventory doc |
| `inventory_nla_share` | 2,571,968 / 3,626,867 (70.9%) | inventory doc |
| `inventory_price_unparseable_count` | 3,670 | inventory doc |

## Observations
- `collections_present.inventory.document_count` = **3,626,867** (`catalog/inventory.bson`).
- `workflow_flags.quantity_on_hand_missing` = **2,735,879** (75.4% of inventory docs); sample rows with `availability=nla` often show `quantity_on_hand: null`.
- `availability_distribution`: **ava** 1,054,856 · **nla** 2,571,968 · **obs** 43 — NLA count matches `inventory_nla_share` numerator.
- `workflow_flags.price_unparseable` = **3,670** (parser failures counted at profile time).
- Supplementary profile context (not segment metrics): `price_outlier_gt_100k` **105**; inventory `meta.deleted_true` **19**; `meta.approved_true` **3,626,838**.
- `profile_verdict` = **MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE** — sample archive, not live DocumentDB.

## Interpretations
- **70.9% NLA** (`availability=nla`) is not equivalent to Shopware stock qty 0 without an explicit mapping contract (semantic-layer limitation on `inventory_nla_share`).
- **75.4%** missing `quantity_on_hand` implies qty/stock policy (OD-04/OD-05) must precede Inventory Loader Agent work in Batch D.
- **3,670** unparseable prices are a bounded DQ surface; full-corpus transform impact still depends on mapping contract and dry-run ledger, not re-derived here.

## Blockers
- **OD-04/OD-05:** Qty/stock fallback semantics unresolved for 2.74M rows with missing `quantity_on_hand`.
- **SDB-price-parse:** 3,670 unparseable prices need DQ queue rules before loader certification.
- **SDB-nla-ava:** `ava` / `nla` / `obs` must map to target `custom_part_availability_code` per mapping contract (Confluence pages 61–65).

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · Segment: inventory · Skill: ptree-segment-data-analyst
