# Target mapping policy

Edit `target-mapping-policy.json` to change transform behavior without code changes.

| Field | Values | Effect |
|-------|--------|--------|
| `modelTarget.decision` | `undecided` \| `category` \| `custom_entity` | Blocks all models when `undecided` (Confluence TBD) |
| `publication.deletedPolicy` | `skip` \| `load_inactive` | Parts/models with `meta.deleted=true` |
| `publication.unapprovedPolicy` | `skip` | Parts with `meta.approved=false` |
| `publication.reviewPolicy` | `skip` | Parts with non-empty `meta.review` |
| `stock.emptyStockRefFallback` | `zero` \| `skip` | Empty `products.stock` string |
| `stock.missingQuantityFallback` | `zero` \| `skip` | Inventory row missing `quantity_on_hand` |
| `media.cdnBase` | URL or `null` | Required to emit Shopware media payloads |
| `assets.collectionPresent` | boolean | When false, parts with `photos[]` refs block on media |

Environment variables override policy at runtime: `OD01_DECISION`, `PUBLICATION_POLICY`, `STOCK_FALLBACK`, `CDN_BASE`.
