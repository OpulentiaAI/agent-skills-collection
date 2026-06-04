# Source data blockers — intent vs measured sample

**Profiled:** `source_profile.json` (2026-06-02, streamed from `input-sample-data.zip` → `Opulent/catalog.zip`)  
**Intent SSOT:** Confluence PDF, `partstree_catalog_shopware_overview.md`, `agentic-migration-execution-strategy.md`, `mapping-contract-starter.csv`

## Intent vs data (summary)

- **Hierarchy:** Docs describe Brand → Brand Family → Model → Model Variant → IPL → Parts in Shopware. Source stores **parts and models in one `products` collection** (`type=part|model`); brands are array fields (`marketing_brand`, `manufacturing_brand`), not a collection. **No `assets.bson`** in the sample, so IPL diagrams and media cannot be profiled or dry-run loaded.
- **Workflow gating:** Confluence/cataloger describes `sync`, `review`, `approved`, `deleted` driving ETL. Measured BSON uses **`meta.approved`**, **`meta.deleted`**, **`meta.review`**; top-level `sync` was not observed on profiled records. Ingestion must map `meta.*` explicitly.
- **Stock/price:** Intent joins `products.stock` → `inventory.source`. Sample has **973,287** products with empty `stock`, **2,735,879** inventory rows missing `quantity_on_hand`, **3,670** unparseable prices — matches prior dry-run DQ counts.
- **Publication:** **438,979** products and **19** inventory rows with `meta.deleted=true`; **26,545** / **29** unapproved — requires human Shopware semantics (OD-06).
- **Media:** **4,622,287** products with empty `photos[]`; resolving URLs requires **`assets`** collection absent from archive (OD-03).
- **Sample vs live:** Archive is explicitly **not live DocumentDB**; SHA-256 recorded for outer zip only. Production freeze (G0) still needs live snapshot + per-BSON checksums (OD-16).

## Blocker register

| ID | Severity | Finding | Evidence | Owner agent role | Gate(s) |
|----|----------|---------|----------|------------------|---------|
| SDB-01 | P0 | Full **`assets.bson` missing** — media and IPL load groups have zero candidates | `source_profile.json` collections_present.assets; `catalog_zip_bson_members` (only accounts/inventory/products); `dry-run-groups.csv` media/IPL blocked | Source Snapshot Agent; Media/IPL Contract Agent | G0, G1, G4 |
| SDB-02 | P0 | Sample archive **not production source freeze** — cannot certify live cutover | `source_profile.json` profile_verdict; `source_snapshot_manifest.json` source_environment; OD-16 | Access/Infra Agent; Human Migration Lead | G0, G1, G7 |
| SDB-03 | P0 | **`attributes.bson` missing** — attribute/metadata parity unmeasured | `source_profile.json`; manifest collections | Source Snapshot Agent | G1 |
| SDB-04 | P1 | **No separate brands/models/IPL collections** — hierarchy embedded in `products` + external assets | `source_profile.json` brands_models_ipls; Confluence hierarchy; overview.md | Mapping Contract Agent; Source Profile Agent | G1, G2 |
| SDB-05 | P1 | **973,287** products with empty `stock` — inventory join impossible without fallback contract | `source_profile.json` join_metrics; `quality-issue-counts.csv` | Mapping Contract Agent; Data Quality Queue Agent | G2, G4 |
| SDB-06 | P1 | **2,735,879** inventory rows missing `quantity_on_hand` | `source_profile.json` inventory.workflow_flags | Mapping Contract Agent | G2, G4 |
| SDB-07 | P1 | **438,979** deleted products (+ **19** inventory) — publication gating undefined for Shopware | `source_profile.json`; OD-06 | Human Domain Owner; Mapping Contract Agent | G2, G4 |
| SDB-08 | P1 | **26,545** unapproved products — must not load without policy | `source_profile.json` | Mapping Contract Agent | G2, G4 |
| SDB-09 | P1 | **4,784,435** products missing `equipment_type` — navigation/search assumptions fragile | `source_profile.json` products.workflow_flags | Mapping Contract Agent | G2 |
| SDB-10 | P1 | **4,622,287** products with empty `photos[]` — media completeness low; assets required to resolve | `source_profile.json`; mapping-contract-starter L9 | Media/IPL Contract Agent | G1, G4 |
| SDB-11 | P1 | Workflow fields live under **`meta.*`**, not documented top-level `sync`/`approved` | `source_profile.json` record_samples; Confluence “sync flag”; products.metadata indexes `meta.approved` | Mapping Contract Agent | G2 |
| SDB-12 | P1 | **355,939** products carry `ipl` field but **assets/IPL BSON absent** — IPL plugin contract unverifiable locally | `source_profile.json` brands_models_ipls | Media/IPL Contract Agent; Target Shopware Agent | G1, G3, G4 |
| SDB-13 | P2 | **3,670** inventory price parse failures; **105** prices &gt; 100k (max **380,729.99**) | `source_profile.json`; `quality-issue-counts.csv` | Data Quality Queue Agent | G2, G4 |
| SDB-14 | P2 | **15** product `stock` refs missing matching `inventory.source` | `source_profile.json` join_metrics | Data Quality Queue Agent | G4 |
| SDB-15 | P2 | **`accounts.bson` empty** (0 docs) — account scope unclear for migration | `source_profile.json`; manifest | Source Profile Agent | G1 |
| SDB-16 | P2 | **81** `assets_staging_incremental_*` metadata stubs only — implies incremental asset pipeline, not snapshot | `source_profile.json` assets.metadata_stubs; catalog.zip listing | Source Snapshot Agent | G0, G1 |
| SDB-17 | P2 | Per-BSON checksums verified for **products/inventory/accounts only**; assets/attributes still absent | `source_snapshot_manifest.json` checksum_verification.pending | Source Snapshot Agent | G0 |

## Ranked top blockers

### P0
1. **SDB-01** — No `assets.bson` → media/IPL migration blocked.  
2. **SDB-02** — Sample ≠ live DocumentDB production freeze.  
3. **SDB-03** — No `attributes.bson` in sample.

### P1
4. **SDB-05 / SDB-06** — Stock join gaps and missing quantity_on_hand at scale.  
5. **SDB-07 / SDB-08** — Deleted/unapproved publication policy.  
6. **SDB-04 / SDB-12** — Hierarchy/IPL model mismatch vs Confluence + missing asset join data.  
7. **SDB-11** — `meta.*` workflow path vs documented cataloger flags.

### P2
8. **SDB-13 / SDB-14** — Price DQ and orphan stock refs.  
9. **SDB-15 / SDB-16 / SDB-17** — Empty accounts, incremental asset stubs, checksum gap.

## Alignment with dry-run (unchanged counts)

| Metric | Profile (2026-06-02) | Prior dry-run |
|--------|----------------------|---------------|
| products docs | 5,142,183 | 5,142,183 |
| inventory docs | 3,626,867 | 3,626,867 |
| parts / models | 4,759,440 / 382,743 | same |
| deleted products | 438,979 | 438,998 (~rounding) |
| unapproved products | 26,545 | 26,574 |
| missing qty_on_hand | 2,735,879 | 2,735,879 |
| price parse failures | 3,670 | 3,670 |
