# 4. Transform and Pipeline Failures

The PartsTree Catalog DB → Shopware migration did not fail primarily at load time. It failed earlier, in a two-stage transform pipeline that was built to **fail closed**: normalize BSON into contract-shaped JSON, then map normalized rows into Shopware write payloads with explicit error codes and a machine-readable issue ledger. Assessment evidence from 2026-06-02 shows that even on a modest sample (10,000 parts + 1,000 models from real `products.bson`), only **71.6%** of rows produced a payload (`7,879 / 11,000`). The remaining **28.4%** were skipped or blocked for reasons that were predictable from open architecture decisions and missing source artifacts—not from random ETL bugs.

This section explains what the dry-run measured, how production transform libraries behave, and how sample-scale failures project to full-catalog counts documented in `dry-run-groups.csv` and `quality-issue-counts.csv`.

## Pipeline architecture and verification posture

The assessment transform path is intentionally split so normalization and Shopware mapping can be tested independently:

1. **BSON normalization** (`discoveries/assessment/scripts/transform_products.py`) streams `products.bson` and joins a subset of `inventory.bson` by `products.stock` → `inventory.source`, emitting `normalized_sample.jsonl`.
2. **Payload mapping** (`discoveries/assessment/lib/shopware-mapper.mjs`, invoked via `transform_to_shopware_payload.mjs` / `run_transform_dry_run.mjs`) reads normalized JSONL and writes `shopware_payload_sample.jsonl` plus `transform_errors.jsonl`, incrementing counters in `transform_stats.json`.

Gate verification (`verify_assessment_report.json`) passed structurally: schemas exist, scripts exist, output artifacts exist, and `error_rate_documented` matched the stats file (**0.2837** error rate, **7,879** successes on **11,000** input rows). That pass confirms the **measurement apparatus** works; it does not imply the catalog is load-ready. The high error rate is a **contract and data-availability signal**, not a flaky runner.

Active policies during the run (from `transform_stats.json`):

| Policy | Value | Effect |
|--------|-------|--------|
| `OD01_DECISION` | `UNDECIDED` | All non-deleted models blocked at map stage |
| `PUBLICATION_POLICY` | `skip` | Deleted rows emit `skipped_deleted`, no payload |
| `STOCK_FALLBACK` | `zero` | Missing stock ref or absent qty can still succeed with zero stock |
| `CDN_BASE` | `null` | No CDN URLs attached even when media would otherwise resolve |
| `assets.collectionPresent` | `false` (policy file) | Parts with `photos[]` refs blocked when assets collection absent |

## Dry-run success rate: 71.6% and what failed

The headline metric from `transform_stats.json` and `verify_assessment_report.json`:

| Outcome | Count | Share of 11,000 |
|---------|------:|----------------:|
| **Success** (payload written) | 7,879 | **71.6%** |
| **Failed / skipped** | 3,121 | **28.4%** |

The error ledger (`transform_errors.jsonl`, 3,121 lines) decomposes failures by `error_code`. Counts match the stats counters exactly:

| Error code | Count | % of input | Primary entity |
|------------|------:|-----------:|----------------|
| `blocked_no_media` | 2,065 | 18.8% | Parts with photo refs, no `assets.bson` |
| `blocked_model_mapping` | 923 | 8.4% | Models (OD-01 undecided) |
| `skipped_deleted` | 77 | 0.7% | Models marked `meta.deleted` |
| `blocked_price_parse` | 56 | 0.5% | Parts with unparseable inventory price |
| `skipped_unapproved` | 0 | 0% | None in this sample slice |
| `skipped_review` | 0 | 0% | None in this sample slice |
| Other blocked codes | 0 | 0% | Stock/inventory/publication blocks unused in sample |

**Interpretation by entity type:**

- **Models (1,000 rows):** Zero Shopware payloads succeeded. Of 1,000 models, **77** were `skipped_deleted` and **923** were `blocked_model_mapping`—i.e. **100% of non-deleted models** in the sample were blocked because Option 1 (category) vs Option 2 (custom entity) was still `UNDECIDED`. Normalization already tags loadable models with `workflow_status: blocked_od01_mapping` and `shopware_target_decision: UNDECIDED_OD01` before mapping runs.
- **Parts (10,000 rows):** Effective part-level success ≈ **78.8%** (`7,879 / 10,000`), with failures dominated by media (**2,065**) and price parse (**56**). Deleted-part skips did not appear in the error ledger for this slice (publication gating may be rare in the first 10K part stream order).

A separate but important success-side metric: **`stock_fallback_used: 1,054`** (~13.4% of successful payloads). These rows **did not fail**; they loaded with zero or fallback stock under `STOCK_FALLBACK=zero` when `quantity_on_hand` was absent or stock ref was empty per policy. That defers catalog-wide quantity risk rather than surfacing it as transform errors in the sample.

## Blocked models (Option undecided — OD-01)

Confluence **Option 1** maps `type=model` rows to Shopware **categories**; **Option 2** uses a **custom entity** with IPL joins. Until `OD01_DECISION` is set to `category` or `custom_entity`, `resolvePolicy()` in `shopware-mapper.mjs` sets `modelBlocked: true`, and `mapModelRow()` returns `blocked_model_mapping` with detail `model→category vs custom entity undecided`.

Example ledger row pattern:

```json
{"error_code":"blocked_model_mapping","detail":"model→category vs custom entity undecided","normalized":{"workflow_status":"blocked_od01_mapping","shopware_target_decision":"UNDECIDED_OD01","ipl_refs":["ARIPS01IPL W0035310001"]}}
```

At **full-catalog** scale (`local-migration-dry-run-summary.json` / `dry-run-groups.csv`), the models group shows **382,743** candidates, **141,758** blocked, **240,985** loadable—if and only if OD-01 is frozen and category/custom-field contracts exist. The sample’s **92.3% model block rate** (923/1000 non-deleted) is the expected operational default while the decision remains open; loaders must not treat model transforms as production-ready.

## Media blocks: photos refs without `assets.bson`

Media failure is the largest single sample category (**2,065** rows, **18.8%**). Normalization sets `media_status: blocked_no_assets_collection` whenever a part has non-empty `photos[]` but `target-mapping-policy.json` declares `assets.collectionPresent: false`. Mapping then fails closed in `mapPartRow()`:

```javascript
if (row.media_status === 'blocked_no_assets_collection' && row.photos_refs?.length > 0) {
  return { error: BLOCKED_NO_MEDIA, detail: `photos_refs=N; assets.bson missing` }
}
```

Typical errors show otherwise **loadable** parts—approved, not deleted, inventory joined, price parse OK—with rich `photos_refs` arrays (often 4–9 refs) and `brand_keys` populated. Example detail: `photos_refs=8; assets.bson missing`.

Full-catalog dry-run groups tell the same story at the pipeline level:

| Group | Candidates | Blocked | Loadable | Gate note |
|-------|----------:|--------:|---------:|-----------|
| `media_assets_to_shopware_media` | 0 | 1 | 0 | **blocked: full assets.bson not supplied** |
| `ipls_to_custom_entity` | 0 | 1 | 0 | **blocked: IPL/assets source not supplied** |

Until `assets.bson` (and IPL linkage) is in the snapshot and CDN resolution is configured (`CDN_BASE`), **no media or IPL payloads** can be validated end-to-end, regardless of part transform success.

## Deleted, unapproved, and publication gating

Publication rules are applied in **normalization** (`workflowStatus()` / `workflow_status()` in JS and Python): `meta.deleted` → `skipped_deleted`, `meta.approved=false` → `skipped_unapproved`, non-empty `meta.review` → `skipped_review`. With `PUBLICATION_POLICY=skip`, mapping emits typed skip errors and **does not** write payloads (the `load_inactive` branch for deleted rows remains a stub in `mapPartRow`).

Sample counts:

- **`skipped_deleted`:** 77 (all observed in the model tail of the combined JSONL stream)
- **`skipped_unapproved`:** 0 in sample (does not mean absent catalog-wide)
- **`skipped_review`:** 0 in sample

Catalog-wide quality counts (`quality-issue-counts.csv`) quantify the underlying source flags:

| Issue type | Count |
|------------|------:|
| `source_marked_deleted` | 438,998 |
| `source_unapproved` | 26,574 |

Dry-run groups apply the same gates at scale: **323,782** blocked of **4,759,440** part candidates (~6.8% blocked) and **141,758** blocked of **382,743** model candidates (~37.0% blocked) when combining approval/deletion/mapping gates—not identical to the 28.4% sample error rate because group-level accounting includes mapping/schema gates beyond the assessment sample.

## Stock, inventory join, and price-parse failure modes

The mapper supports additional failure modes that were **inactive in the sample** but wired for production:

| Code | Trigger | Sample count | Catalog-wide signal |
|------|---------|-------------:|---------------------|
| `blocked_stock_missing_ref` | Empty `products.stock` and fallback ≠ `zero` | 0 | 590,649 `product_missing_stock_ref` |
| `blocked_inventory_missing` | Stock ref not in inventory index | 0 | 16 `product_stock_ref_missing_inventory` |
| `blocked_price_parse` | `inventory.price` unparseable | 56 | 3,670 `inventory_price_parse_failure` |
| (fallback, not error) | `stock_fallback_used` | 1,054 successes | 2,735,879 `inventory_missing_quantity_on_hand` |

`parsePrice()` accepts numbers and comma-stripped strings; BSON oddities (empty strings, non-numeric text) yield `price_parse_ok: false` and hard block. Price-parse errors often co-occur with `photos_refs: []` and `media_status: empty_refs`—data-quality issues on NLA/zero-qty SKUs rather than join failures.

Inventory group at scale: **3,626,867** candidates, **3,718** blocked, **3,623,149** loadable (~99.9%), consistent with price-parse and approval gates being a thin tail **when** stock fallback policy is frozen to `zero`.

## Production transform library behavior (failure modes by design)

The libraries under `discoveries/assessment/lib/` are the production assessment transforms (not ad-hoc scripts):

**`normalize-product.mjs` / `transform_products.py` (parity):**

- Pure functions: no Shopware API calls.
- Stock join: `products.stock` → inventory doc; statuses `missing_ref`, `missing_inventory`, `inventory_deleted`, `joined`.
- Media: distinguishes `empty_refs` vs `blocked_no_assets_collection`.
- Models: force `blocked_od01_mapping` when otherwise loadable.

**`shopware-mapper.mjs`:**

- Config-driven `loadPolicy()` / `resolvePolicy()` merges env vars and `target-mapping-policy.json`.
- `mapPartRow()` ordered checks: publication skip → media block → stock/inventory block → price parse → stock qty fallback → payload assembly.
- `mapModelRow()` publication skip → OD-01 block → else category/custom payload.
- `transformStream()` never swallows errors: each failure increments counters and appends one JSON line to `transform_errors.jsonl` via `TransformError.toJSON()`.

**`errors.mjs`:**

- Stable string codes for ledger analytics and gate scripts (`blocked_no_media`, `blocked_model_mapping`, etc.).

**Orchestration (`run_transform_dry_run.mjs`):**

- Python normalize → Node map → `transform_stats.json` with `error_rate = 1 - success/input_rows`.

Failure modes are **explicit and enumerable** by design (pstack idempotency and evidence-driven migration). The dominant failures are **policy and missing collections**, not uncaught exceptions—`other_errors: 0` in the sample run.

## Sample vs full-catalog projection

The 71.6% figure is a **deliberately harsh** sample: first 10K parts in BSON order plus 1K models, with assets absent and OD-01 open. Full-catalog dry-run groups from `local-migration-dry-run-summary.json` paint a different headline for **parts** and **inventory** once group-level gates are applied:

| Dry-run group | Loadable % (approx.) | Dominant blocker |
|---------------|---------------------:|------------------|
| `parts_to_shopware_products` | 93.2% (4.44M / 4.76M) | Deleted/unapproved/schema/stock gates |
| `inventory_to_product_stock_price` | 99.9% | Price parse + approval |
| `models_to_shopware_categories` | 63.0% | Mapping + publication (OD-01 not reflected as 100% block) |
| `media_assets_to_shopware_media` | 0% | No assets snapshot |
| `ipls_to_custom_entity` | 0% | No IPL/assets path |

The gap between **93% part loadability** (group estimate) and **71.6% payload success** (assessment sample) is explained by **media blocking on any `photos[]` ref** (18.8% of sample rows) and **100% model failure** in the 1K-model slice. Treating the sample rate as the global product success rate would understate part-only throughput and overstate model readiness.

## Implications for the post-mortem

Transform failures were not mysterious pipeline exceptions; they were **encoded outcomes** of frozen gates:

1. **Unfrozen OD-01** zeroed model payload generation in the sample and left ~141K model-scale blocks in group accounting.
2. **Missing `assets.bson`** blocked every part with photo references in-sample and zeroed entire media/IPL dry-run groups.
3. **Publication and stock policies** skipped or softened deleted/unapproved/qty issues—surfacing 77 deleted skips and 1,054 stock fallbacks in-sample while catalog quality counts show **439K deleted** and **2.74M missing qty** still requiring client policy, not silent loader defaults.

Until G3/G4 gates require payload hashes reconciled against Shopware reads, transform stats and `transform_errors.jsonl` remain the authoritative pre-load **failure budget**—and at 28.4% on the reference sample, that budget was too large to start Batch D loaders without first closing OD-01, supplying assets, and freezing publication/stock contracts.
