---
name: agentic-migration-orchestration
description: Run a large Catalog→target migration with phased agents, inspectable artifacts, and independent verification. Use when work spans multiple sessions, parallel workstreams, or child agents — not for one-off analysis.
---

# Agentic migration orchestration

**Goal:** Verified progress without agents amplifying ambiguity. Parallelism is a tool, not the objective.

## When to use

- Multi-phase migration program (discovery → contracts → dry-run → load → sync)
- Spawning child agents with explicit deliverable paths
- Coordinating independent seams (access vs profile vs target contract)

## When not to use

- Single self-service analysis pass → RECREATE prompt + `run_self_service_analysis.mjs`
- One segment or intent report → `ptree-*` analyst skills
- Production cutover decisions → `human-escalation-judgment` first

## Inputs

| Input | Path |
|-------|------|
| Phased playbook | `agent/orchestration/workflow.md` |
| Workstream roles | `discoveries/matrices/agent-workstream-matrix.csv` |
| Evidence index | `notes/evidence_index.md` |
| Analysis brief | `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md` |

## Outputs

| Output | Path |
|--------|------|
| Phase artifacts | Profiles, contracts, ledgers, reconciliation reports under `discoveries/` |
| Decision trail | `discoveries/matrices/decision-log.tsv` |
| Gate checks (optional) | `node agent/scripts/verify-gates.mjs` |

## Principles

- Prove with artifacts and target reads, not summaries — see `reference/pstack/principle-prove-it-works`, `reference/pstack/show-me-your-work`.
- Validate at boundaries; make loads and sync events idempotent.
- Parallelize only across **independent seams**; separate shared state before fan-out (`reference/pstack/principle-separate-before-serializing-shared-state`).
- **Stop before loaders** when source shape, mapping blockers, target contract, or dry-run proof is still unknown.
- Workstream matrix and gate CSVs describe **how a fleet could run** — not proof of readiness.

## Workflow

Follow dependency order in `workflow.md`: discovery → contracts → dry-run → load → staging/prod (human approval) → sync. Give each child agent repo context, inputs, deliverable paths, and stop conditions. Prefer written artifacts over chat verdicts. After each phase, read the files, update ledgers, then start dependents. When no playbook fits, design one with `reference/pstack/figure-it-out`.

## Evidence

Analysis evidence is Confluence + `source_profile.json`. Execution evidence is contracts, hashes, and reconciliation — verified on real artifacts, not delegate self-reports.

## Related

- `evidence-driven-migration`, `human-escalation-judgment`
- Pstack index: `agent/skills/reference/pstack/`
- Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`
