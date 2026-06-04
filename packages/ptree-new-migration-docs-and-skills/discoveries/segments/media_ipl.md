# Segment: media_ipl

## Question
Can the sample archive support Confluence IPL plugin loading and CDN-backed product media, and what is blocked when `assets.bson` is absent?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `assets_collection_present` | false (`collections_present.assets.status` = **missing**; `bson` null; `document_count` 0) | archive |
| `assets_metadata_stub_count` | 81 (`collections_present.assets.metadata_stubs`) | archive |
| `photos_empty_rate` | 4,622,287 / 5,142,183 (89.9%) | product doc |
| `products_with_ipl_field_count` | 355,939 (`workflow_flags.ipl_field_present` / `brands_models_ipls.products_with_ipl_field`) | product doc |
| `parts_blocked_no_media_rate_sample` | 2,065 / 10,000 (20.65%) | part sample |

## Observations
- **`collections_present.assets`:** `bson` **null**, `status` **missing**, `document_count` **0**; `notes` = *no assets.bson; only assets_staging_incremental_*.metadata.json stubs*; **`metadata_stubs` = 81**. This is **data absence** in the archive—not evidence that production has zero media or IPL assets.
- **`catalog_zip_bson_members`** lists only `accounts.bson`, `inventory.bson`, `products.bson`—no `catalog/assets.bson` member in the sample zip manifest.
- **`workflow_flags.photos_empty`** = **4,622,287** on **5,142,183** products → **519,896** products carry non-empty `photos[]` refs; empty rate does **not** prove assets exist or resolve to CDN URLs.
- **`products_with_ipl_field_count`** = **355,939**; `brands_models_ipls.notes` states hierarchy is encoded in `products.type` and `products.ipl` / assets joins—not separate IPL collections.
- Transform dry-run (`transform_stats.json`, 10k part sample): **`blocked_no_media`** **2,065**; errors cite `photos_refs` present and **`assets.bson missing`** (`media_status`: `blocked_no_assets_collection`). **`CDN_BASE`** = **null** in policies.
- `intent_alignment_notes`: *Media/IPL load groups require assets.bson + plugin contract; sample archive blocks G1 media/IPL verification.*

## Interpretations
- **INT-002** and **INT-003** are **GAP**: IPL field refs (**355,939**) and photo refs (**~520K** non-empty) exist on products; the assets collection and CDN contract are **not present** in the sample—cannot verify joins, diagram metadata, or Shopware media URLs.
- Missing **`assets.bson`** must not be read as “zero diagrams” or “no media in catalog”; it means this export **cannot answer** media/IPL loader or G1 verification questions until a signed assets BSON (or equivalent) is delivered (**SDB-assets-missing**).
- At require-media transform policy, **~20.65%** of the part sample blocks despite loadable workflow and inventory—scale implies large media-op volume once assets are restored, not a negligible edge case.

## Blockers
- **SDB-assets-missing:** Primary client deliverable for media/IPL (recovery calendar weeks 3–4).
- **CDN_BASE_URL:** Required per access matrix; null in transform policies blocks URL materialization.
- **CLI-009–013 / IM-002:** Media/IPL paths depend on signed assets export; post-mortem flags incomplete client handoff.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · Segment: media_ipl · Skill: ptree-segment-data-analyst · Transform: discoveries/assessment/output/transform_stats.json
