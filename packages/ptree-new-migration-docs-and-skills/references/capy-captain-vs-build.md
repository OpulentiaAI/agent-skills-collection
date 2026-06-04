# Captain vs Build: Why We Split the AI Agent in Two

- **Source:** https://capy.ai/blog/captain-vs-build
- **Fetched:** 2026-06-03

## Summary

Capy argues that **planning and execution should not be one agent move**: single-agent coding loops force humans to supply the architecture implicitly, while the agent only follows the literal prompt. They split roles: **Captain** (technical architect—reads code, researches, asks clarifying questions, writes exhaustive specs, **never** writes production code or runs terminals) and **Build** (executor—Ubuntu VM, edits files, runs commands, opens PRs from a zero-guesswork spec).

Captain’s output is a short PRD-style spec naming files, constraints, and success criteria; ambiguity in the spec becomes churn in implementation. Build does not ask mid-task clarifying questions—it only sees spec + codebase—so spec quality is the bottleneck. **Guardrails** enforce the split: Captain read-only; Build full VM/git/test/fix loop. The split pays off for wide work (multi-layer features, large refactors, investigations); tiny edits can skip Captain.

Latency trade-off: two agents can be faster in wall-clock when async Build runs and spec quality avoids rewrite loops. Quote: “Every ambiguity in your specification becomes a problem in implementation.”

## Key takeaways

- **Separation of concerns**: architect plans; executor ships—mirrors staff-engineer vs. implementer.
- Specs must be concrete (files, patterns, auth behavior, rate limits, success criteria).
- Build’s no-clarification rule makes upfront questioning Captain’s critical job.
- Read-only planner reduces risk of half-baked code during exploration.
- Full-VM executor needs good specs to avoid destructive or scope-drifting edits.
- Best for cross-cutting migration tasks (schema, APIs, sync, storefront)—not typo fixes.
- Human orchestration labor moves into the system—relevant when designing agent playbooks.
- Quality is won in planning; execution is commoditized given a tight brief.

## How we apply this

Structure PTREE agents like Captain/Build: **analysis skills** (`ptree-segment-data-analyst`, `ptree-intent-comparison-analyst`, RECREATE prompt) produce specs and governed metrics; **execution skills** (`evidence-driven-migration`, loaders in `workflow.md`) run only against approved mapping contracts and dry-run proofs. Captain analog = Confluence + `semantic-layer.md` + segment notes; Build analog = transform dry-run and future Shopware loaders. Keep `agent/skills/SKILL-AUTHORING.md` “when not to use” boundaries so planners don’t write load scripts. For client demo, present Captain output first (intent comparison, blocker matrix), then gate Build behind G0–G8 evidence.
