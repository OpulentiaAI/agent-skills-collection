# The April Update: Captain Takes the Helm

- **Source:** https://capy.ai/blog/april-2026-update
- **Fetched:** 2026-06-03

## Summary

Capy’s April 2026 update **deprecates standalone Build mode** and consolidates workflow under **Captain-only** threads. Users describe an outcome once; Captain plans, delegates implementation to Build agents, monitors progress, and opens PRs while keeping plan, execution, and PR in **one conversation**. Tasks are **thread-local** (Task 1, 2, 3 per thread) instead of global task numbers, reducing cross-thread confusion.

**Model configuration** is now per-thread: separate Captain and Build model picks, plus speed/reasoning toggles. **Claude Opus 4.7** is the default Captain model. Each thread gets a unique ID (e.g. SCO-1234) surfaced in sidebar, dashboard, and Slack for traceability.

**CI awareness** is new: when Captain opens a PR, it subscribes to checks, reads failures, and can route fixes back through the workflow without the user pasting logs. This extends the Captain/Build split from planning-only into **closed-loop delivery** (plan → execute → verify in CI).

## Key takeaways

- **Orchestrator-first UX**: one conversation owns plan, delegation, and PR lifecycle.
- Build becomes an internal executor, not a separate user-facing mode.
- Thread-scoped models let you trade speed vs. depth per task without global settings.
- Traceability IDs tie chat threads to shipped work—useful for audit narratives in demos.
- **CI subscription** closes the loop on “agent shipped but checks failed”—reduces human log triage.
- Thread-local task numbering simplifies mental model for parallel client workstreams.
- Implies migration/agent fleets should embed **verify-after-write** (gates, dry-run) in the orchestrator, not as a manual step.

## How we apply this

Treat the RECREATE analysis pass as **Captain-like planning** (Confluence + sample scope, questions, spec in discovery log) and gated load work as **Build-like execution** only after `verify-gates.mjs` and dry-run evidence—never merge planning and production load in one unconstrained agent thread. Document thread/workstream IDs in `discoveries/matrices/decision-log.tsv` analogous to SCO-1234. For demo prep, show **one narrative thread**: analysis artifacts → open decisions → gate status, with CI/gate failures as first-class feedback like Capy’s PR checks. Reference `agent/orchestration/workflow.md` as the orchestrator contract Captain embodies.
