# 10. Semantic Layer and Self-Service Analysis

The nine-month program failed partly because stakeholders and agents answered migration questions from **ad-hoc BSON peeks**, transform logs, and gate summaries — not from a single governed metric layer. That reproduced Anthropic's three analytics failure modes in migration form: **concept↔entity ambiguity** (which collection is "the model"?), **staleness** (sample profile treated as prod freeze), and **retrieval failure** (Confluence PDF vs `meta.*` fields never linked in one registry).

## What we added (June 2026)

| Layer | Path | Role |
|-------|------|------|
| Semantic layer | `discoveries/semantic-layer.md` | Named metrics, segments, intent PASS/GAP |
| Self-service guide | `notes/guides/analysis-self-service-guide.md` | Question → metric → answer procedure |
| Segment analyst skill | `ptree-segment-data-analyst` | Per-domain findings with cited metrics |
| Intent analyst skill | `ptree-intent-comparison-analyst` | Confluence vs measured comparison |
| Blocker mapper skill | `ptree-blocker-delay-mapper` | Delays tied to client evidence + 3mo vs 9mo themes |

## Why this matters for recovery

The twelve-week replay in §8 assumes **week 1–2 discovery** produces measured contracts, not opinions. A semantic layer lets Batch A–C agents and humans self-serve the same numbers:

- **Hierarchy:** `hierarchy_collections_present`, `model_mapping_block_rate_sample` — explains OD-01 delay without re-profiling.
- **Media/IPL:** `assets_collection_present`, `parts_blocked_no_media_rate_sample` — explains zero local IPL rows.
- **Workflow:** `meta_deleted_product_rate`, `meta_unapproved_product_count` — OD-06 policy before loaders.
- **Stock:** `parts_with_empty_stock_rate`, `inventory_qty_on_hand_missing_rate` — join contracts before inventory loader.

Intent registry rows (`INT-001`–`INT-015`) turn Confluence prose into **testable statements** with current `PASS` / `PARTIAL` / `GAP` / `INCONCLUSIVE` from the sample archive.

## Operational rule

Agents and analysts:

1. Read `semantic-layer.md` first.
2. Never invent counts; cite metric names or re-run `profile_source_bson.py`.
3. Escalate product decisions (Option 1/2, publication, prod freeze) via `human-escalation-judgment`.

## Nine-month vs self-service contrast

| Nine-month pattern | Self-service pattern |
|--------------------|----------------------|
| Repeated BSON spot checks | One profile + named metrics |
| Intent debated from memory | Intent registry with evidence links |
| Blockers listed from gate IDs | Blocker matrix from segment + intent + transform stats |
| Each agent re-derived joins | Segment skill + stock_joins hygiene |

This appendix does not replace gate verification (`verify-gates.mjs`); it makes **client-data questions** answerable before gates are run.
