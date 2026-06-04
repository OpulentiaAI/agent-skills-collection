# Introducing Agent Readiness

- **Source:** https://factory.ai/news/agent-readiness
- **Fetched:** 2026-06-03

## Summary

Factory introduces **Agent Readiness**, a framework for measuring how well a repository supports autonomous development. The thesis is that uneven AI coding outcomes often trace to the **environment**—missing linters, undocumented env vars, slow CI feedback—not the model. The framework scores repos across **eight pillars** (style & validation, build system, testing, documentation, dev environment, code quality, observability, security & governance) and **five maturity levels**, from Functional through Autonomous.

Level 3 (**Standardized**) is the recommended production bar: E2E tests, maintained docs, security scanning, and observability so agents can handle routine maintenance. Scoring uses 60+ binary criteria; monorepos evaluate per-application where needed. Organizations unlock a level at **80% pass** for that level and all prior levels. Factory grounds evaluations on prior reports to keep LLM-based scoring stable (variance dropped from ~7% to ~0.6%).

Delivery surfaces include CLI `/readiness-report`, an organization dashboard, and a Readiness Reports API for CI integration. **Automated remediation** can open PRs for foundational gaps (AGENTS.md, linters, pre-commit). The post argues readiness compounds: better environments improve any agent toolchain, not only Factory.

## Key takeaways

- Treat agent failures as **repo hygiene** problems before swapping models or agents.
- Eight pillars map to concrete failure modes (instant feedback vs. ten-minute CI waits).
- **Level 3** is the practical target for production autonomous work on a migration codebase.
- Monorepo scoring is per-app; partial passes (e.g. 3/4 apps) matter for large packages.
- **Gated 80% progression** discourages cherry-picking high-level criteria without foundations.
- Stable scoring requires **grounded re-evaluation**, relevant if we automate readiness checks on the package.
- Remediation focus: missing docs, config files, and basic tooling—high leverage for agent fleets.
- Organization metric: % of **active repos** at Level 3+, not a single average score.

## How we apply this

Run readiness thinking against the PTREE package and AltusNova workspace before scaling agent load work: fast local verification (`verify-gates.mjs`, dry-run scripts), explicit `AGENTS.md`, and skills under `agent/skills/` mirror Factory’s documentation and feedback-loop pillars. Use **discoveries/** artifacts as the agent’s “tests”—profile JSON, gate verdicts, and segment notes—so agents get seconds-not-hours feedback. For client demo prep, cite readiness as the reason analysis stays evidence-driven (Confluence + BSON) rather than prompt-only migration guesses.
