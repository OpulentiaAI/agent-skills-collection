# Agent prompts

| Prompt | Use when |
|--------|----------|
| **[demo-client-brief.md](./demo-client-brief.md)** | **Client demo** — copy the fenced block into a new session (time-boxed, Linear + notify drafts) |
| [known-findings-context.md](./known-findings-context.md) | **SSOT** for 16 baseline findings, sponsor executive summary, delay-narrative instructions; linked from demo brief and skills |
| [RECREATE-ANALYSIS-AGENT-PROMPT.md](./RECREATE-ANALYSIS-AGENT-PROMPT.md) | Full methodology, citation discipline, deep engagements |
| [linear-config.json](./linear-config.json) | Linear team/project/label — **fill `TBD` before demo** |
| [notify-config.json](./notify-config.json) | Stakeholder emails and notify rules — **fill `TBD` before demo** |

**Demo prep:** set `linear-config.json` and `notify-config.json`, then paste [demo-client-brief.md](./demo-client-brief.md). Start from `client-data/extracts/` (not the full zip); record live findings in the **native document pane** at `discoveries/demo-session-findings.md`, with `discoveries/linear-drafts/` and `discoveries/notify-drafts/` for P0 routing.

Execution playbook (loads, not client evidence): `../orchestration/workflow.md`.
