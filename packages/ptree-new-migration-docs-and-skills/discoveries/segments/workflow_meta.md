# Segment: workflow_meta

## Question
How do cataloger workflow flags (`sync`, `review`, `approved`, `deleted`) appear in BSON `meta.*`, and what publication risk exists for ETL/sync?

## Metrics (semantic layer)
| Metric | Value | Grain |
|--------|-------|-------|
| `meta_deleted_product_rate` | 438,979 / 5,142,183 (8.5%) | product doc |
| `meta_unapproved_product_count` | 26,545 / 5,142,183 | product doc |
| `profile_verdict` | MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE | archive |

## Observations

### Confluence cataloger flags (intent context)
Confluence (`01-confluence-target-state.md` / `Confluence-PTREE-010626-130110.pdf`) defines four cataloger flags gating CRON ETL and EventBridge sync:

| Flag | Confluence meaning | Target behavior |
|------|-------------------|-----------------|
| **sync** | Scheduled for synchronization | Row eligible for downstream pickup |
| **review** | In QA queue | Hold from storefront until cleared |
| **approved** | Ready for website/API consumers | May load to Shopware as active/salable per policy |
| **deleted** | Soft delete | Must not appear as salable; explicit skip or `active: false` |

`source_profile.json#intent_alignment_notes`: Confluence documents sync/review/approved/deleted; BSON uses **`meta.approved`**, **`meta.deleted`**, **`meta.review`**; top-level **`sync`** rarely present on sampled paths.

### Products (`collections_present.products.workflow_flags`)
- `document_count` = **5,142,183**
- `meta.approved_true` = **5,115,638**
- `meta.approved_false_or_missing` = **26,545**
- `meta.deleted_true` = **438,979** (8.5% of product corpus)
- Record samples (5 part docs): all show `meta.approved=true`, `meta.deleted=false`, `meta.review=null` — no `sync` field on sampled paths.

### Inventory (`collections_present.inventory.workflow_flags`)
- `document_count` = **3,626,867**
- `meta.approved_true` = **3,626,838**
- `meta.approved_false_or_missing` = **29**
- `meta.deleted_true` = **19**
- Inventory record samples: same `meta.*` shape (`approved`, `deleted`, `review`); workflow incidence is negligible vs products.

### Transform dry-run (publication policy probe)
From `transform_stats.json` (11,000-row sample, `PUBLICATION_POLICY=skip`):
- `skipped_deleted` = **77**
- `skipped_unapproved` = **0**
- `skipped_review` = **0**

## Interpretations
- **8.5%** soft-deleted products remain in the master dump; CRON and EventBridge must apply identical skip/inactive rules (INT-004 **PARTIAL**, INT-010 **PARTIAL**).
- Confluence top-level flag names ≠ BSON nesting — normalization needs explicit `meta.*` → publication field map (**SDB-meta-map**); semantic contract is behavior, not positional names (OD-17).
- Inventory workflow flags are clean (19 deleted, 29 unapproved); product-level gating dominates migration risk.
- Sample profiling cannot certify live change-stream or production freeze behavior (INT-009 **INCONCLUSIVE**, INT-013 **GAP** via `profile_verdict`).

## Blockers
- **OD-06:** Publication semantics for **438,979** deleted and **26,545** unapproved products not signed by domain owner (`skip` vs `load_inactive` changes salable population by ~8.5%).
- **OD-16 / OD-17:** Production vs sample boundary blocks INT-013 PASS; top-level `sync` vs `meta.*` path risk if transforms assume wrong field names.
- **SDB-meta-map:** Schema impedance between Confluence cataloger flag names and BSON `meta.approved` / `meta.deleted` / `meta.review`.

## Provenance
Source: source_profile.json (opulent-sample-bson-2026-06-02) · Segment: workflow_meta · Skill: ptree-segment-data-analyst
