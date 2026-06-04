# PartsTree migration execution package

This directory contains the public, reviewable outputs from the PartsTree Catalog DB → Shopware migration analysis.

## Purpose

The original migration was scoped for three months and took nine. The evidence indicates the failure mode was not raw implementation speed; it was missing control-plane structure:

- source data was not fully profiled before implementation,
- the Shopware target contract was not frozen,
- missing media/IPL source collections blocked execution,
- eventing/concurrency/replay design arrived late,
- failed rows lacked durable issue queues and replay paths,
- workstream progress was not independently verified by artifacts.

The proposed replacement strategy is to run the migration through agents, but only through a gated operating model: source contract, mapping contract, target contract, dry-run ledger, batch ledgers, data-quality queues, independent reconciliation, and human stop/go decisions for irreversible choices.

## Files

| File | Description |
|---|---|
| `agent/orchestration/workflow.md` | Phased migration playbook (supersedes execution-strategy doc). |
| `agent-workstream-matrix.csv` | Agent DAG, dependencies, deliverables, verification owner, and stop conditions. |
| `verification-gates.csv` | G0–G8 verification gates with pass/fail artifacts. |
| `agent/orchestration/workflow.md` | Phase sequencing (batch launch plan consolidated here). |
| `blocker-strategy-report.md` | Evidence-backed blocker report and optimal migration strategy. |
| `local-migration-dry-run-summary.json` | Local dry-run loadability summary from BSON source data. |
| `dry-run-groups.csv` | Candidate/loadable/blocked counts by target load group. |
| `quality-issue-counts.csv` | Data-quality queue counts from the local dry run. |
| `mapping-contract-starter.csv` | Starter mapping contract rows for source → Shopware fields. |
| `decision-log.tsv` | pstack-style audit trail for the analysis and strategy decisions. |

## Non-negotiable execution rule

Do **not** start loader agents until these are verified:

1. access/source manifest,
2. source profile,
3. mapping contract,
4. Shopware target schema/plugin contract,
5. dry-run payload and issue ledgers.

Loader agents must never self-certify. Reconciliation agents independently verify target reads against source-normalized payload hashes.
