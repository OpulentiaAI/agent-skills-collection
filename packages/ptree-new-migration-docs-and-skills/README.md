# PartsTree → Shopware migration package

Five folders separate **client inputs**, **agent tooling**, **analysis outputs**, **narrative docs**, and **external references**.

| Folder | Purpose |
|--------|---------|
| [`client-data/`](client-data/) | Confluence PDF, sample zip pointer, BSON snapshot, manifests |
| [`agent/`](agent/) | Master brief, skills, scripts, orchestration playbook |
| [`discoveries/`](discoveries/) | Profiles, segments, intent comparison, blockers, assessment, matrices |
| [`notes/`](notes/) | Post-mortem, guides, evidence index |
| [`references/`](references/) | Summarized third-party articles (agent readiness, analytics, orchestration) |

## How agents should work

1. **Analysis (client demo):** Start with `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md` — Confluence + sample BSON, discovery log, governed metrics in `discoveries/semantic-layer.md`.
2. **Execution (load program):** Phased contracts before loaders — `agent/orchestration/workflow.md`; skills `evidence-driven-migration`, `agentic-migration-orchestration`.

Skills are optional helpers, not a mandatory pipeline.

## Commands (AltusNova repo root)

```bash
python3 NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/agent/scripts/profile_source_bson.py
node NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/agent/scripts/run_self_service_analysis.mjs
node NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/agent/scripts/verify-gates.mjs
node NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/discoveries/assessment/scripts/run_transform_dry_run.mjs
```

## Entrypoints

- Workspace: `AltusNova/AGENTS.md`
- Skill symlinks: `AltusNova/.agent/skills/` → `agent/skills/`
