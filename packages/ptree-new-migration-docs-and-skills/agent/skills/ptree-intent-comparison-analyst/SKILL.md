---
name: ptree-intent-comparison-analyst
description: Compare Confluence target-state claims to measured sample data using the intent registry in semantic-layer.md. Use for PASS/GAP/PARTIAL/INCONCLUSIVE answers, client "does the data support the spec?" questions, or intent-comparison-report updates.
---

# Intent comparison analyst

Answer: **does the documented plan match what we can measure in the sample?**

## When to use

- Building or refreshing `intent-comparison-report.md`
- Executive or client questions that map to `INT-*` rows
- Validating a Confluence claim against profile metrics

## When not to use

- Deep single-domain BSON narrative → `ptree-segment-data-analyst`
- Delay estimates or nine-month recovery story → `ptree-blocker-delay-mapper`
- Choosing OD-01 Option 1 vs 2, certifying live Shopware, or substituting gate verdicts for client data

## Inputs

| Input | Path |
|-------|------|
| Intent registry + metrics | `discoveries/semantic-layer.md` |
| Measured values | `discoveries/profiles/source_profile.json` |
| Confluence intent | `client-data/confluence/Confluence-PTREE-010626-130110.pdf` |
| Segment context (optional) | `discoveries/segments/*.md` |

## Outputs

| Output | Path |
|--------|------|
| Intent comparison report | `discoveries/intent/intent-comparison-report.md` |
| Status per intent | PASS · GAP · PARTIAL · INCONCLUSIVE (prefer INCONCLUSIVE over forced PASS) |

## Principles

- Restate each plan claim as one testable sentence; disambiguate terms (e.g. BSON `type=model` vs Shopware category).
- Every PASS/PARTIAL gets one adversarial caveat (sample limits, policy masks, wrong grain).
- INCONCLUSIVE is not a pass — missing assets or production freeze stay visible.
- Quote Confluence section/page when restating each intent.
- Verify by reading profile paths, not summarizing from memory (`reference/pstack/principle-prove-it-works`).

## Workflow

For each major intent in `semantic-layer.md`: restate the claim, name verification metric(s) and record measured values, assign status, add caveat, link evidence (profile path, PDF section, segment note). Write readable prose first; a summary table is fine. Show your status reasoning in the report body — sponsors should see *why*, not just labels.

## Evidence

Base conclusions on **PDF + profile in this run**. Prior gate files or agent JSON are orientation only, not proof.

## Related

- `ptree-segment-data-analyst`, `ptree-blocker-delay-mapper`
- Pstack: `reference/pstack/interrogate` (stress-test PASS rows)
- Master brief: `agent/prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md`
