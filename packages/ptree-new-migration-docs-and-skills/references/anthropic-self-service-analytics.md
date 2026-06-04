# How Anthropic enables self-service data analytics with Claude

- **Source:** https://claude.com/blog/how-anthropic-enables-self-service-data-analytics-with-claude
- **Fetched:** 2026-06-03

## Summary

Anthropic’s data team describes how **~95% of business analytics queries** run through Claude with ~95% aggregate accuracy—by treating analytics as a **context and verification** problem, not raw SQL generation. Unlike coding agents, analytics often has a single correct answer with no deterministic proof; errors cluster around **concept↔entity ambiguity**, **staleness**, and **retrieval failure** across huge warehouses.

Their **agentic analytics stack** has four layers: **data foundations** (canonical, governed datasets; CI-enforced standards; colocated transforms and docs; metadata as product), **sources of truth** (semantic layer first, then lineage, distilled query patterns—not raw SQL grep—and business context), **skills** (procedural routing: pairwise knowledge + process skills; LLM-oriented reference docs; skill maintenance in the same PR as model changes), and **validation** (offline Q/A evals, ablations, adversarial review, provenance footers, passive monitoring, correction harvesting).

Skills moved offline accuracy from ~21% to **95%+**; without maintenance, accuracy drifted from ~95% to ~65% in a month. Key negative ablation: giving agents direct access to thousands of prior SQL queries barely moved accuracy—the bottleneck was **structured entity mapping**, not more examples. Getting started: a few canonical datasets, dozens of offline evals, and a thin knowledge skill capture most upside.

## Key takeaways

- **Governed metrics** (semantic layer / canonical tables) beat warehouse-wide search for agent accuracy.
- Three failure modes: wrong field choice, stale docs/models, and failure to find the right curated doc.
- **Skills are procedural knowledge**: consult sources in order, clarify, query, adversarial review.
- Pairwise skills: thin router + domain reference files narrow retrieval before SQL.
- Colocate skill markdown with data/model PRs; gate reporting changes without skill updates.
- Offline evals should approach **100%** on covered domains; anchor ground truth to snapshots.
- Raw query-corpus retrieval ≈ useless; **distilled reference docs** in skills work.
- Online: provenance footer, adversarial review (+6% accuracy, +latency), harvest user corrections into evals.
- Silent wrong answers remain the hardest risk—provenance and KPI sanity checks help.

## How we apply this

Map Anthropic’s stack onto PTREE **analysis**, not Shopware load: `discoveries/semantic-layer.md` and `source_profile.json` are our governed metrics; segment and intent skills are routers; Confluence PDF + BSON sample are sources of truth. The **RECREATE-ANALYSIS-AGENT-PROMPT** should enforce “semantic layer first, raw BSON exploration fallback,” mirroring semantic-layer-before-raw-SQL. Maintain skills beside `discoveries/` updates (same PR discipline). For demo prep, frame self-service answers as **profile-backed** with explicit freshness (sample boundary in manifests) and cite artifacts in footers—analogous to provenance. Use `notes/guides/analysis-self-service-guide.md` as the thin router; expand domain reference under `discoveries/segments/` rather than dumping prior agent JSON as proof.
