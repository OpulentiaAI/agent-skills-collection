---
name: ptree-blocker-delay-mapper
description: Map migration discoveries to blocker types and recovery timeline themes using segment findings, intent comparison, and transform_stats — client evidence first. Use for delay matrices, nine-month vs three-month narrative, or steering conversations about preventable slips.
---

# Blocker / delay mapper

Connect **what we found** to **what it costs in time** — for steering conversations, not gate theater.

## When to use

- Building `blocker-delay-matrix.tsv` and `blocker-delay-narrative.md`
- Explaining why early profiling would have shortened the prior program
- Linking `DISC-*` discoveries to roles from the workstream matrix

## When not to use

- First-pass segment profiling → `ptree-segment-data-analyst`
- Intent PASS/GAP table → `ptree-intent-comparison-analyst`
- Precise project plans or committed cutover dates

## Inputs

| Input | Path |
|-------|------|
| Segment notes | `discoveries/segments/*.md` |
| Intent comparison | `discoveries/intent/intent-comparison-report.md` |
| Transform feasibility | `discoveries/assessment/output/transform_stats.json` |
| Metric names | `discoveries/semantic-layer.md` |
| Theme structure (not proof) | `notes/post-mortem/ptree-migration-postmortem-report.md` |
| Role vocabulary | `discoveries/matrices/agent-workstream-matrix.csv` |

## Outputs

| Output | Path |
|--------|------|
| Blocker matrix | `discoveries/blockers/blocker-delay-matrix.tsv` |
| Narrative | `discoveries/blockers/blocker-delay-narrative.md` |

Matrix columns (flexible): `discovery_id`, `segment`, `intent_id`, `blocker_type` (data \| schema \| process \| vendor \| decision), `delay_weeks_estimate`, `preventable`, `who_would_catch`, `evidence_ref`.

Estimates are **ranges with labels**, grounded in metrics and post-mortem calendar themes — not precise schedules.

## Principles

- Lead with data evidence (`assets_collection_present=false`, empty-stock rate, etc.), not "G2 failed."
- Re-derive discoveries from Confluence + profile; do not copy old blocker lists as proof.
- Post-mortem recovery calendar (§8) is a reference theme, not a script.
- Each theme ties discoveries → nine-month pattern → what earlier analysis would have surfaced.
- Log material estimates in `discoveries/matrices/decision-log.tsv` when they drive a decision.

## Workflow

Read segment and intent outputs plus `transform_stats.json` when transform feasibility matters. For each material theme, draft matrix rows then narrative sections: discoveries with metrics, historical pattern, earlier catch point, prevention. Keep prose readable for sponsors; matrix is the sortable index.

## Evidence

Blocker claims require profile or transform stats paths. Confluence supports *why the plan assumed X*, not substitute for measured gaps.

## Related

- `ptree-segment-data-analyst`, `ptree-intent-comparison-analyst`
- Matrix usage: `agent/orchestration/matrix-usage.md`
- Pstack: `reference/pstack/show-me-your-work`, `reference/pstack/figure-it-out`
- Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`
