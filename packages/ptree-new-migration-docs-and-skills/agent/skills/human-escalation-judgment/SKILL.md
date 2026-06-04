---
name: human-escalation-judgment
description: Decide when to keep going vs pause for a human during migrations — scope, risk, credentials, production, or irreversible choices. Use before production writes, cutover, conflicting business rules, or when verification is INCONCLUSIVE on a one-way door.
---

# Human escalation judgment

**Default:** Keep going on reversible, local, evidence-gathering work. Pause when the next step changes production, scope, or business semantics you cannot infer.

## When to use

- Next step is production write, cutover, or irreversible schema change
- Required source missing; critical verification mismatch
- Choosing between conflicting business rules (OD-01, publication policy, CDN)
- Credentials or access missing for an external system

## When not to use

- Profiling, dry-runs, documentation, or local scripts with no external side effects
- Expected artifact missing but analysis can continue with stated limits
- Routine segment or intent work within RECREATE evidence contract

## Inputs

| Input | Path |
|-------|------|
| Open decisions | `discoveries/matrices/open_decisions.tsv` |
| Verification state | Gate verdicts, reconciliation reports, intent INCONCLUSIVE rows |
| Escalation context | Segment notes, blocker matrix, quality queue |

## Outputs

| Output | Path / form |
|--------|-------------|
| Escalation packet | Decision needed · options · evidence paths · risk · recommended action · safe parallel work |
| Decision log row | `discoveries/matrices/decision-log.tsv` (one row per escalation) |

## Principles

- Proceed without asking on profiling, dry-runs, docs, reversible scripts — log meaningful decisions on long runs.
- Update human and keep working when gaps are non-critical and workarounds are reversible.
- **Block and ask** before production writes, data loss acceptance, scope shrink, or bypassing failed verification.
- **Escalate immediately** when preconditions are false, loads are non-idempotent, or replay cannot converge.
- Do not treat INCONCLUSIVE as pass; do not invent credentials.

## Workflow

Classify the next action: proceed, notify-and-continue, block-and-ask, or escalate-immediately. If blocking, assemble a short packet with evidence paths (not vibes). Log the escalation. Continue only safe parallel work explicitly listed in the packet.

## Evidence

Every escalation cites artifact paths (`source_profile.json` metric, contract row, verification output). Weak evidence → stay INCONCLUSIVE and ask rather than proceed.

## Related

- `agentic-migration-orchestration`, `evidence-driven-migration`
- Pstack: `reference/pstack/show-me-your-work` (decision-log format)
- Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`
