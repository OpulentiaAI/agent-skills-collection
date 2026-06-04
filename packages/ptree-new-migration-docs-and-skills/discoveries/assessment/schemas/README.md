# PTREE migration target-state schemas

JSON Schema **draft 2020-12** artifacts for the PartsTree Catalog DB → Shopware migration assessment (post-mortem, 2026-06-02).

## Intended hierarchy vs actual source

Confluence and `partstree_catalog_shopware_overview.md` describe a **layered catalog**:

```text
Brand → Brand Family → Model → Model Variant → IPL (diagram) → Parts
```

Each layer maps to distinct Shopware constructs (categories, products, custom IPL entity, media associations).

### What the BSON archive actually contains

| Intended entity | Expected collection | Actual sample archive |
|-----------------|---------------------|------------------------|
| Brand | brands / category scaffold | `marketing_brand[]` / `manufacturing_brand[]` on `products` |
| Model | models | `products` where `type=model` (382,743 rows) |
| IPL | assets / ipls | `products.ipl[]` on models + separate `assets` collection — **`assets.bson` missing** |
| Part | parts | `products` where `type=part` (4,759,440 rows) |
| Stock/price | inventory | `inventory` joined via `products.stock → inventory.source` |

**Single-collection collapse:** All sellable catalog rows live in one `products` collection. Hierarchy is inferred from `type`, brand arrays, and optional `ipl` references — not from normalized source tables. This mismatch drove **OD-01** (model→category vs custom entity), blocked IPL/media loaders, and inflated transform complexity.

## Schema files

| File | Role |
|------|------|
| `source-product.schema.json` | DocumentDB `products` document shape |
| `source-inventory.schema.json` | DocumentDB `inventory` document shape |
| `normalized-product.schema.json` | Intermediate part row after workflow + stock join |
| `normalized-model.schema.json` | Intermediate model row (blocked until OD-01) |
| `normalized-ipl.schema.json` | IPL stub (requires assets join) |
| `shopware-product-write.schema.json` | Admin API product upsert payload |
| `shopware-category-write.schema.json` | Category upsert for models/brands |
| `shopware-media-ref.schema.json` | Media association by CDN/source ref |
| `shopware-custom-fields.schema.json` | PartsTree custom field bundle |
| `compact-sync-event.schema.json` | Batch F EventBridge compact event (IDs only) |

## Workflow flags

Source BSON uses **`meta.approved`**, **`meta.deleted`**, **`meta.review`** — not top-level `sync` as documented in early Confluence ETL notes. Normalized schemas expose `workflow_status` enum derived from meta flags.

## Stock join rules

1. `products.stock` (non-empty) must match `inventory.source`.
2. Empty `products.stock` → `stock_join_status: missing_ref` (973,287 products in profile).
3. Missing `inventory.quantity_on_hand` → `quantity_status: absent` with fallback policy **OD-05** (not frozen in assessment transforms).

## Validation

```bash
node discoveries/assessment/scripts/verify_assessment.mjs
```
