# Client demo — copy-paste agent brief

**Use this for the initial demo session.** Fill `linear-config.json` and `notify-config.json` before the demo (replace `TBD` values). Full methodology: [RECREATE-ANALYSIS-AGENT-PROMPT.md](./RECREATE-ANALYSIS-AGENT-PROMPT.md).

Copy everything inside the fence below into a new agent session. Paths assume AltusNova repo root.

---

```markdown
# PartsTree migration analysis (client demo)

You are assessing Catalog DB → Shopware migration for PartsTree. Deliver a citation-backed comparison of **documented target state** (Confluence export) to **measured sample data** (BSON archive) for a steering audience — calm, precise, honest about sample limits.

## Mission

Compare the Confluence architecture plan to what the client sample actually contains: scale, hierarchy, inventory joins, media/IPL, and workflow signals. Name gaps that block migration or need a client decision — with evidence from the PDF and profile only.

## Sources (confirm, then use)

1. `agent-skills-collection/docs/Confluence-PTREE-010626-130110.pdf`
2. **Primary (no LFS):** `client-data/extracts/` — `source_profile.json`, `samples/*.jsonl`, `manifest.json`, `overview.md`
3. **Optional full archive:** `agent-skills-collection/docs/input-sample-data.zip` → `Opulent/catalog.zip` → BSON members (Git LFS)

Package root for outputs: `ptree-new-migration-docs-and-skills/` (or `NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/`). Write under `discoveries/` and `client-data/` only.

## Do NOT explore

- Broad repo walk, gate files, batch agent JSON, consulting registers, or post-mortem/historical notes unless the user explicitly asks
- `agent/skills/reference/`, `notes/post-mortem/`, assessment code spelunking, or transform dry-runs unless blocked on a specific gap
- Treating prior automation output as proof — re-derive metrics from the PDF + this session's profile

## Time-box discovery

Spend minimal time orienting: confirm Confluence PDF + `client-data/extracts/` exist; use extracts for metrics (or run `python3 agent/scripts/build_data_extracts.py` if missing). Optionally list BSON members from `extracts/manifest.json` (`python3 agent/scripts/profile_source_bson.py` from repo root → `discoveries/profiles/source_profile.json`), then move to analysis. No second profiling pass unless integrity fails.

## How to work (in order)

**First deliverable in-session:** skeleton `discoveries/intent-comparison-report.md` (major plan claims vs placeholder metrics) plus one segment note stub — then deepen.

Profile the sample and state `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` until the client proves a production cut. Read the PDF for testable intentions (hierarchy, Shopware MVP, media/CDN, workflow, sync, IDs, scale). Write segment notes for the major domains (parts, models/IPL, inventory, workflow, stock joins, media, hierarchy signals) with facts vs inferences separated. Compare each major intent to measurement (PASS / GAP / PARTIAL / INCONCLUSIVE). Register gaps with Confluence + `source_profile.json` citations and severity (high/medium/low).

**Reporting findings:** Read `agent/prompts/linear-config.json`. For each **high** or **medium** gap, open a Linear issue (title, discovery ID, client citation, recommended owner role, suggested priority) or, if config values are `TBD`, write issue bodies to `discoveries/linear-drafts/{discovery-id}.md`. Attempt Linear API/MCP only if configured and available in the session.

**Stakeholder notify:** Read `agent/prompts/notify-config.json`. For **key issues** (P0 blockers, client decisions needed — e.g. OD-01, missing assets), send a concise summary per stakeholder rules; if emails are `TBD`, write drafts to `discoveries/notify-drafts/{issue-id}.md`.

Keep a lightweight discovery log (`DISC-###`: observation, evidence, confidence, open question). Executive prose first; evidence ledger in gap table or appendix (`CONF:…`, `DATA:…`).

## Done when

- `discoveries/analysis-findings-report.md` — sponsor-readable executive summary with sample boundary stated
- `discoveries/linear-drafts/` — one draft (or live Linear issue) per high/medium gap
- `discoveries/notify-drafts/` — drafts for P0 / decision-needed items (at minimum)
- Intent comparison and segment notes linked from the executive summary

Optional skills only if stuck on one domain: `ptree-segment-data-analyst`, `ptree-intent-comparison-analyst` under `agent/skills/`.
```
