---
name: ptree-segment-data-analyst
description: Deep dive on one PartsTree catalog domain (parts, models, inventory, workflow, stock joins, media/IPL, brands) using semantic-layer metrics and source_profile.json. Use when writing segment notes, profiling one BSON concern, or answering "what does the sample show for X?" — not for loaders or cutover.
---

# Segment data analyst

Write **one segment** of a migration assessment: what the sample shows in a single catalog concern, with honest limits.

## When to use

- One domain needs a sponsor-ready note (`products_parts`, `media_ipl`, etc.)
- Metrics from `semantic-layer.md` must be explained with profile paths
- A discovery log entry needs a deeper segment appendix

## When not to use

- PASS/GAP intent comparison across the whole plan → `ptree-intent-comparison-analyst`
- Timeline or blocker narrative → `ptree-blocker-delay-mapper`
- Production loads, mapping approval, or Shopware certification

## Inputs

| Input | Path |
|-------|------|
| Metric definitions | `discoveries/semantic-layer.md` |
| Measured values | `discoveries/profiles/source_profile.json` |
| Confluence intent | `client-data/confluence/Confluence-PTREE-010626-130110.pdf` (repo copy: `agent-skills-collection/docs/…`) |
| Sample archive | `client-data/sample/` · `agent-skills-collection/docs/input-sample-data.zip` |
| Optional refresh | `python3 agent/scripts/profile_source_bson.py` (repo root) |

## Outputs

| Output | Path |
|--------|------|
| Segment note | `discoveries/segments/{segment_id}.md` |
| Cross-links | Reference metric names; link intent rows if relevant |

## Principles

- Counts and rates come from the profile — do not invent them.
- On first use of domain terms in segment prose, cite the Part 1 definition from `notes/glossary-and-findings.md` (e.g. IPL, compact event, NLA).
- Separate **fact** (profile path + value) from **interpretation** (labeled inference).
- Sample ≠ production freeze; say so when it matters.
- If transform dry-run policies mask gaps (e.g. stock fallback), say so.
- Stuck on missing collections or ambiguous Confluence → note it; escalate via `human-escalation-judgment` before committing scope.

## Workflow

Read `semantic-layer.md` and `source_profile.json` for your segment. Pick one row from the segment table below. Draft the note: question, metrics (name + value + grain), observations tied to profile paths, interpretations clearly labeled, open questions, provenance. Log material forks in `discoveries/matrices/decision-log.tsv` when the segment drives a scope decision (see `reference/pstack/show-me-your-work`).

## Segments (pick one)

| Segment | What you're explaining |
|---------|------------------------|
| `products_parts` | Part SKUs, stock refs, photos, deletion/approval |
| `products_models` | Model grain, IPL refs, Shopware mapping friction (OD-01) |
| `inventory` | Rows, qty/NLA, price parse health |
| `workflow_meta` | `meta.*` vs Confluence cataloger workflow |
| `stock_joins` | `products.stock` → `inventory.source`, orphans, fallback |
| `media_ipl` | Assets presence, empty photos, IPL refs without assets |
| `brands_on_products` | Brand arrays, equipment type, collapsed hierarchy |

## Evidence

Conclusions require **Confluence PDF + profile** in this run. Prior gate files or agent JSON are orientation only, not proof. Cite metrics by name from `semantic-layer.md`.

## Related

- `ptree-intent-comparison-analyst`, `ptree-blocker-delay-mapper`
- Pstack (by reference): `reference/pstack/show-me-your-work`, `reference/pstack/figure-it-out`
- Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`
