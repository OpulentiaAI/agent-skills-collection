# Self-service analysis guide

Analysts and agents should answer migration questions from **governed metrics and client evidence** — not ad-hoc BSON guesses. This guide complements the master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`.

## What to open first

| Need | Where |
|------|--------|
| Metric definitions & intents | `discoveries/semantic-layer.md` |
| Measured values | `discoveries/profiles/source_profile.json` |
| Target-state plan | Confluence PDF under `agent-skills-collection/docs/` |
| Sample data | `input-sample-data.zip` → `Opulent/catalog.zip` |

Refresh profile when needed: `python3 …/agent/scripts/profile_source_bson.py` (repo root).

## Answering a question

1. Find or define the metric in `semantic-layer.md` (name, grain, limitation).
2. Read the value from `source_profile.json` (or transform stats for dry-run questions).
3. Answer in plain language; attach evidence in a ledger or footnote (`CONF:…`, `DATA:metric_name`).
4. State limitations (sample not prod freeze, missing `assets.bson`, policy masks in dry-run).

Optional deep dives: skills under `agent/skills/` — none are mandatory steps.

## Common questions

**Stock join health** — segment `stock_joins`; metrics like `parts_with_empty_stock_rate`, `product_stock_join_ok_count`.

**Does data support Confluence hierarchy?** — intents `INT-001`, `INT-014`; intent comparison skill or `discoveries/intent/intent-comparison-report.md`.

**What drove delay?** — segment + intent findings + `transform_stats.json`; blocker mapper → matrix + narrative. Lead with profile metrics, not gate IDs.

## Boundaries

| Fine | Escalate |
|------|----------|
| Read profile, semantic layer, PDF excerpts | Invent counts not in profile |
| Segment notes under `discoveries/segments/` | Claim production parity from sample alone |
| Re-profile or dry-run sample | Start production loaders |
| Surface OD-01 / publication / freeze gaps | Auto-resolve business policy |

## Checklist command

```bash
node agent/scripts/run_self_service_analysis.mjs
```

Lists which artifacts exist; does not replace judgment on PDF quotes.

## Related

- `discoveries/semantic-layer.md`
- `notes/post-mortem/analysis-findings-report.md` — structure inspiration only; re-derive numbers each run
