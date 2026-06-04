# External references

Curated third-party articles relevant to agent-assisted migration analysis, orchestration, and self-service evidence. Summaries are ours; full content remains at the linked publishers.

## Index

| Slug | Article | One-line description |
|------|---------|----------------------|
| [factory-agent-readiness](factory-agent-readiness.md) | [Introducing Agent Readiness](https://factory.ai/news/agent-readiness) | Score repos on eight pillars and five maturity levels so coding agents get fast feedback and clear docs. |
| [anthropic-self-service-analytics](anthropic-self-service-analytics.md) | [Self-service data analytics with Claude](https://claude.com/blog/how-anthropic-enables-self-service-data-analytics-with-claude) | Governed metrics, skills, and evals to fix ambiguity, staleness, and retrieval—not SQL generation alone. |
| [cognition-multi-agents-working](cognition-multi-agents-working.md) | [Multi-Agents: What's Actually Working](https://cognition.ai/blog/multi-agents-working) | Single-threaded writes; clean-context review and smart-friend patterns that work in production. |
| [capy-captain-vs-build](capy-captain-vs-build.md) | [Captain vs Build](https://capy.ai/blog/captain-vs-build) | Split planner (read-only specs) from executor (VM/git) to cut rewrite loops on complex work. |
| [capy-april-2026-update](capy-april-2026-update.md) | [April 2026 update](https://capy.ai/blog/april-2026-update) | Captain-only threads, per-thread models, trace IDs, and CI-aware PR follow-up. |

## Suggested reading order (client demo prep)

1. **anthropic-self-service-analytics** — Frames why PTREE uses governed profiles, semantic layer, and skills instead of ad-hoc BSON queries.
2. **factory-agent-readiness** — Explains why the package invests in scripts, gates, and `AGENTS.md` before scaling agents.
3. **capy-captain-vs-build** — Narrative for separating analysis (Captain) from gated load execution (Build).
4. **capy-april-2026-update** — Short update on orchestrator-owned threads and CI closure (maps to `verify-gates.mjs`).
5. **cognition-multi-agents-working** — Depth for technical stakeholders on review loops and avoiding parallel writer swarms on one migration artifact.

## License and attribution

These files are **summaries and PTREE-specific application notes** only. They are not copies of the original articles. Copyright and terms belong to Factory, Anthropic, Cognition, and Capy respectively. Always use the source URLs for quotations, screenshots, or redistribution. Do not commit scraped full text from publishers into this repo.
