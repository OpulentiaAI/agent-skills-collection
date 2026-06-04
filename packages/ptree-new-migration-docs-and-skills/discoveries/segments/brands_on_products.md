# Segment: brands_on_products

## Question
How is brand and hierarchy metadata encoded on the single polymorphic `products` collection, and does BSON support Confluence Brand→Family→Model→Variant→IPL→Parts navigation without separate brand/model/IPL collections?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `equipment_type_empty_rate` | 4,784,435 / 5,142,183 (93.0%) | product doc |
| `hierarchy_collections_present` | false | catalog |
| `product_document_count` | 5,142,183 | product doc |
| `part_document_count` | 4,759,440 | part doc |
| `model_document_count` | 382,743 | model doc |
| `products_with_ipl_field_count` | 355,939 / 5,142,183 | product doc |
| `profile_verdict` | MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE | archive |

## Observations

### Archive shape (single polymorphic products)
- `catalog_zip_bson_members` lists only `accounts.bson`, `inventory.bson`, `products.bson` — no `brands.bson`, `models.bson`, or `ipls.bson`.
- `collections_present.brands_models_ipls.notes`: **No separate brands/models/IPL collections**; hierarchy encoded in `products.type` (`part` | `model`) and `products.ipl` / assets joins.
- `hierarchy_collections_present` = **false** (semantic layer; aligns with profile `brands_models_ipls`).

### Equipment type sparsity
- `collections_present.products.workflow_flags.equipment_type_empty` = **4,784,435** of **5,142,183** product docs (**93.0%**).
- Semantic-layer definition: empty or missing `equipment_type` on product doc (hurts category/SEO key stability per INT-001 context).

### Marketing brand distribution (embedded arrays)
Brand is stored as **arrays on each product document** (`marketing_brand`, `manufacturing_brand`, `product_family`) — **not** a normalized `brands` collection (skill gotcha).

Top `marketing_brand` values from `collections_present.products.top_marketing_brand_samples`:

| marketing_brand | doc count (sample profile) |
|-----------------|----------------------------|
| Briggs & Stratton | 424,769 |
| Lawn-Boy | 310,621 |
| Toro Consumer | 309,544 |
| Toro Commercial | 301,653 |
| Husqvarna | 264,757 |
| Cub Cadet | 240,961 |
| MTD | 216,390 |
| Snapper | 204,678 |
| Simplicity | 193,288 |
| Cub Cadet Commercial | 181,979 |
| Electrolux/AYP | 163,168 |
| Troy-Bilt | 161,603 |
| Poulan | 158,678 |
| Murray | 152,823 |
| Briggs & Stratton Power | 150,856 |

### Record samples (shape)
Five part samples (`record_samples`) all show parallel arrays, e.g. `marketing_brand: ["Snapper"]`, `manufacturing_brand: ["Snapper"]` — no separate brand entity key; `equipment_type` not shown on sampled paths (consistent with high empty rate).

### Intent alignment (profile notes)
`intent_alignment_notes`: Confluence expects Brand→Model→IPL→Parts hierarchy in Shopware; source uses **single products collection** with `type=part|model` and assets/IPL data **not in sample archive**.

## Interpretations
- **INT-001 GAP:** Six-level Confluence navigation cannot be sourced from distinct BSON collections; Shopware tree must be **derived** via mapping contract from embedded brand/family fields + `type` discriminator + IPL refs (355,939 docs with `ipl` field).
- **93.0%** missing `equipment_type` implies Brand Equipment Type Page and category keys need explicit defaulting or enrichment policy — not inferable from BSON alone.
- Top marketing brands are populated on a meaningful subset (~424k docs for top brand vs 5.1M corpus); brand **coverage is uneven** and string-valued (variant spellings: Toro Consumer vs Toro Commercial, Cub Cadet vs Cub Cadet Commercial).
- Hierarchy rework narrative (post-mortem 12–33w) reflects **schema impedance** (CLI-001 / IM-001), not part volume alone.
- Sample archive verdict blocks treating brand/hierarchy counts as production freeze (INT-013 **GAP**).

## Blockers
- **OD-01:** Model placement in Shopware tree unresolved — blocks brand→family→model path completion.
- **SDB-hierarchy-collapse:** Single `products` polymorph vs Confluence six-level tree; mapping contract must define array→category/entity rules.
- **OD-16:** `profile_verdict` = `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` — brand distribution may shift on production DocumentDB export.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · Segment: brands_on_products · Skill: ptree-segment-data-analyst
