# Secrets readiness — PartsTree → Shopware migration

## Pass criteria

Every secret required for G0 services is named, has a storage backend, and is reachable by the migration principal **or** is explicitly deferred with owner and scope impact.

## Status: NOT_VERIFIED (local workspace)

Live credentials were intentionally out of scope per `decision-log.tsv` (external access INCONCLUSIVE; user Skip).

## Secret inventory

| secret_name | service | environments | storage | present | rotation_owner | last_verified | deferral |
|-------------|---------|--------------|---------|---------|----------------|---------------|----------|
| SHOPWARE_ADMIN_CLIENT_ID | Shopware | dev,staging,prod | TBD | unknown | Human Migration Lead | | required for G3 |
| SHOPWARE_ADMIN_CLIENT_SECRET | Shopware | dev,staging,prod | TBD | unknown | Human Migration Lead | | required for G3 |
| DOCUMENTDB_URI | DocumentDB | dev,staging,prod | TBD | unknown | Human Migration Lead | | deferred; local BSON sample used |
| AWS_* | AWS | all | TBD | unknown | Human Migration Lead | | deferred |

## Verification log

- [ ] Dev Shopware Admin API token exchange
- [ ] Staging Shopware Admin API token exchange
- [ ] DocumentDB connect (read-only) from approved runner/VPC
- [x] Confluence PDF available at `agent-skills-collection/docs/Confluence-PTREE-010626-130110.pdf`

## Blockers

- No Shopware OAuth credentials in workspace
- No DocumentDB connection string (local sample archive only)

## Deferrals

| item | owner | scope_impact | notes |
|------|-------|--------------|-------|
| Live DocumentDB | Human Migration Lead | G0 live freeze; G5+ loads | Use `source_snapshot_manifest.json` sample boundary |
| Shopware Admin API | Human Migration Lead | G3, all loaders | Required before Batch D |
