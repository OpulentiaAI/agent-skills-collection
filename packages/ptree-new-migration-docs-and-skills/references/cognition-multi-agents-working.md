# Multi-Agents: What's Actually Working

- **Source:** https://cognition.ai/blog/multi-agents-working
- **Fetched:** 2026-06-03

## Summary

Cognition revisits their earlier “don’t build multi-agents” guidance: **parallel writer swarms** still fail when implicit style and edge-case decisions conflict, but a narrower pattern works—**multiple agents contribute intelligence while writes stay single-threaded**. Context engineering remains central: shared context, plans, and priors; actions carry implicit decisions that fragment when many agents write at once.

Two production patterns stand out. **Code-review loop:** a dedicated reviewer with **clean context** (diff only, no shared pre-read with the coder) catches ~2 bugs per PR (~58% severe) because attention isn’t diluted by the coder’s long trajectory; bridging back to the coder’s full user context filters false positives. **Smart friend:** a frontier model consulted by a primary model via tool call—works today when **both models are strong** (cross-frontier routing by capability); asymmetric “weaker primary escalates to stronger friend” is still an open training problem. Context transfer works best as a **fork of full primary context** and broad questions (“what should I do?”).

Looking ahead, **manager agents** split large scope (multi-PR features, migrations) via map-reduce-and-manage; unstructured agent swarms are mostly a distraction. Open problems are **communication**: when to escalate, how children surface discoveries to siblings, how to transfer context without drowning receivers.

## Key takeaways

- Prefer **one writer**; use other agents for review, planning, search, and consultation.
- Read-only subagents (search, Deepwiki) are tool-like; interactive collaboration needs tighter harness design.
- **Generator–verifier with isolated context** improves review quality vs. shared-context self-review.
- Filter review findings through the writer’s full task context to avoid loops and scope creep.
- **Smart friend** pattern: expensive model on demand; full-context fork + open questions beat narrow asks.
- Cross-frontier smart friend = **capability router** (debug vs. visual vs. tests), not just difficulty escalation.
- Manager/child agents need explicit fixes: avoid over-prescriptive managers, no assumed shared state, train cross-agent messaging.
- Real software needs human taste scaling—not demos with simple verifiable success criteria only.
- Unstructured multi-agent negotiation networks: low practical ROI today.

## How we apply this

Align PTREE orchestration with **single-writer evidence**: one agent owns `discoveries/` updates per workstream; others read Confluence/BSON and produce segment or intent **reports**, not competing edits to the same matrix. Use `agentic-migration-orchestration` and `workflow.md` for manager-style phasing (gates G0–G8), not parallel loaders. For analysis QA, adopt review-loop thinking: a fresh-context agent re-reads `intent-comparison-report.md` or gate verdicts against `source_profile.json` without assuming the author’s chain-of-thought. Defer multi-writer “swarm” migration scripts until mapping contracts are frozen—matches Cognition’s write-serialization lesson for PartsTree → Shopware.
