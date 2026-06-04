# Migration workflow (agent playbook)

This is **how to run a gated migration program** — not evidence for a client demo. For analysis evidence, use `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md` (Confluence + sample profile).

## What “done” means

Every in-scope source record has a terminal state: loaded and reconciled, rejected with reason, or deferred with explicit approval. Loads are idempotent; payload hashes match target reads; failures are replayable.

## Phases

Work in dependency order. Finish and **inspect artifacts** before starting the next phase.

| Phase | Focus | Typical outputs |
|-------|--------|-----------------|
| **A — Discovery** | Access, source manifest, target readiness, evidence index | `access_matrix.csv`, `source_snapshot_manifest.json`, target smoke or explicit block |
| **B — Contracts** | Profile real BSON, mapping contract, schema/media scope | `source_profile.json`, `mapping_contract.csv`, target schema snapshot |
| **C — Dry-run** | Normalize locally, quality queue, manifests, independent verify | Payload hashes, `batch_manifest.csv`, reconciliation report |
| **D — Dev load** | Loaders in dependency order + reconciliation each step | Ledgers, target read-back |
| **E — Staging/prod** | Same scripts as dev | Human approval before prod |
| **F — Sync** | Compact events, ledger, DLQ/replay | After baseline proven |

**When to stop:** Do not run loaders while source shape, mapping blockers, target contract, or dry-run proof is still open. Late discovery of OD-01, missing assets, and weak joins is what stretched three months into nine — not agent count.

## Parallel agents

Within a phase, parallelize only **independent** work (e.g. access + snapshot + target probe). Do not fan out loaders before contracts exist. Role names in `discoveries/matrices/agent-workstream-matrix.csv` are a roster reference — see `matrix-usage.md`.

## Evidence vs automation

- **Client evidence:** Confluence PDF, `source_profile.json`, segment/intent reports, gap ledger.
- **Program automation:** `verify-gates.mjs` updates `gate_verdicts.tsv` from artifact presence — helpful for ops, not a substitute for measured analysis.

## Skills

- Analysis: `ptree-segment-data-analyst`, `ptree-intent-comparison-analyst`, `ptree-blocker-delay-mapper`
- Execution: `evidence-driven-migration`, `agentic-migration-orchestration`, `human-escalation-judgment`

## Commands (package root or repo root)

```bash
node agent/scripts/run_self_service_analysis.mjs   # analysis artifact checklist
node agent/scripts/verify-gates.mjs                  # gate ledger from artifacts
python3 agent/scripts/profile_source_bson.py         # refresh profile (repo root)
```
