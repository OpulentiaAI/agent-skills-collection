---
name: evidence-driven-migration
description: Migrate catalogs or platforms through profiles, mapping contracts, dry-run ledgers, idempotent loaders, and independent reconciliation. Use when correctness matters more than speed, or when standing up migration contracts before any production write.
---

# Evidence-driven migration

Turn migration into **contracts you can inspect** — source truth, mapping, target shape, then loads.

## When to use

- Building or validating migration artifacts (profile, mapping contract, ledger, reconciliation)
- Dry-run or load program after analysis gates are understood
- Handoff packages for human review before production

## When not to use

- Self-service Confluence vs sample analysis → RECREATE prompt + `ptree-*` analyst skills
- One-off segment notes without execution intent
- Production cutover without `human-escalation-judgment` clearance

## Inputs

| Input | Path |
|-------|------|
| Source snapshot | `client-data/manifests/source_snapshot_manifest.json`, BSON under `client-data/snapshot/` |
| Profile | `discoveries/profiles/source_profile.json` |
| Mapping starter | `discoveries/matrices/mapping-contract-starter.csv` |
| Target schemas | `discoveries/assessment/schemas/` |
| Dry-run scripts | `discoveries/assessment/scripts/run_transform_dry_run.mjs` |

## Outputs

| Artifact | Path / role |
|----------|-------------|
| `source_manifest.json` | Snapshot checksums, missing collections |
| `source_profile.json` | Counts, types, joins, outliers |
| `mapping_contract.csv` | Source → transform → target; blocker rows block loads |
| `target_contract.json` | Schema, plugins, custom fields, smoke writes |
| Quality / ledger | Rejected rows and load state with payload hashes |
| `batch_manifest.csv` | Deterministic load order |
| `reconciliation_report.json` | Source vs target read-back |

## Principles

- Missing in-scope collections are a scope conversation, not a silent skip.
- No target writes while mapping blockers remain.
- Dry-run rows end `READY_TO_LOAD`, `REJECTED_WITH_REASON`, or `DEFERRED_WITH_APPROVAL`; hash payloads; reruns should match.
- Reconcile independently — inconclusive is not a pass.
- Sync uses same normalization + ledger; idempotent handlers; daily reconciliation (`reference/pstack/principle-make-operations-idempotent` if loaded).

## Workflow

Profile source from real records. Draft mapping contract with owner and status per field. Prove target contract with smoke writes. Dry-run payloads locally with hashed outputs. Load in dependency order (reference → hierarchy → entities → inventory → media → associations → publish). Reconcile with someone who did not load. Hand off to humans with artifact paths, open blockers, quality queue summary, and next safe action.

## Evidence

Execution proof is **artifacts + target read-back**, not chat summaries. Analysis-phase evidence remains Confluence + `source_profile.json`.

## Related

- `agentic-migration-orchestration`, `human-escalation-judgment`
- BSON shape: `reference/mongodb/mongodb-schema-design`
- Pstack: `reference/pstack/principle-prove-it-works`, `reference/pstack/show-me-your-work`
