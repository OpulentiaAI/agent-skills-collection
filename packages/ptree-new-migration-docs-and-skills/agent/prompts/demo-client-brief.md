# Client demo — copy-paste agent brief

**Use this for the initial demo session.** Fill `linear-config.json` and `notify-config.json` before the demo (replace `TBD` values). Full methodology: [RECREATE-ANALYSIS-AGENT-PROMPT.md](./RECREATE-ANALYSIS-AGENT-PROMPT.md).

Copy everything inside the fence below into a new agent session. Paths are relative to the **package root** unless noted as repo root.

**Package root (pick the clone you are in):**

- AltusNova: `NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/`
- Collection: `agent-skills-collection/packages/ptree-new-migration-docs-and-skills/`

---

```markdown
# PartsTree migration analysis (client demo)

You are assessing Catalog DB → Shopware migration for PartsTree. Deliver a citation-backed comparison of **documented target state** (Confluence export) to **measured sample data** for a steering audience — calm, precise, honest about sample limits.

## Mission

Compare the Confluence architecture plan to what the client sample actually contains: scale, hierarchy, inventory joins, media/IPL, and workflow signals. Name gaps that block migration or need a client decision — with evidence from the PDF and governed metrics only.

## Sources (confirm, then use)

**Confluence (target intent)** — use the first path that exists in your clone:

- Package: `client-data/confluence/Confluence-PTREE-010626-130110.pdf`
- Collection repo root: `agent-skills-collection/docs/Confluence-PTREE-010626-130110.pdf`
- AltusNova repo root: `docs/Confluence-PTREE-010626-130110.pdf` (if mirrored locally)

**Primary metrics (no LFS):** `client-data/extracts/` — `overview.md`, `source_profile.json`, `manifest.json`, `samples/*.jsonl`

**Optional full archive:** `agent-skills-collection/docs/input-sample-data.zip` (LFS at collection root) → `Opulent/catalog.zip` → BSON; or local extract under `client-data/snapshot/`

**Scripts (run from package root):** `python3 agent/scripts/build_data_extracts.py` (regen extracts) · `python3 agent/scripts/profile_source_bson.py` (writes `discoveries/profiles/source_profile.json`)

**Config:** `agent/prompts/linear-config.json`, `agent/prompts/notify-config.json`

Write analysis under `discoveries/` and manifests under `client-data/` only.

## Do NOT explore

- Broad repo walk, gate files, batch agent JSON, consulting registers, or post-mortem/historical notes unless the user explicitly asks
- `agent/skills/reference/`, `notes/post-mortem/`, assessment code spelunking, or transform dry-runs unless blocked on a specific gap
- Treating prior automation output as proof — re-derive metrics from the PDF + this session's extracts/profile

## Time-box discovery

Confirm Confluence PDF + `client-data/extracts/` exist (regen extracts if missing). Use `extracts/source_profile.json` for metrics; profile BSON only if integrity fails. One orientation pass, then analysis.

## Recording findings (native document pane)

**Primary working surface:** Cursor's **native document pane** — create and edit markdown in the workspace so the sponsor sees live progress in the editor, not chat-only summaries.

1. Open or create **`discoveries/demo-session-findings.md`** at session start and keep it updated continuously.
2. Structure (top → bottom): **executive summary** (refresh as you learn) → **discovery log** (`DISC-###`) → **intent comparison table** → **gap register** (severity, dual citations).
3. Mirror stable tables to `discoveries/intent/intent-comparison-report.md`, `discoveries/segments/*.md`, and `discoveries/analysis-findings-report.md` when ready for git — but the **document pane file is the live demo deliverable**.
4. Do not bury conclusions only in terminal output or chat; write through to the open document as you work.

## How to work (in order)

**First in-session deliverable:** skeleton `discoveries/demo-session-findings.md` plus stubs in `discoveries/intent/intent-comparison-report.md` and one `discoveries/segments/*.md` note — then deepen.

State `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` until the client proves a production cut. Read the PDF for testable intentions; write segment notes (parts, models/IPL, inventory, workflow, stock joins, media, hierarchy) with facts vs inferences separated. Compare intents (PASS / GAP / PARTIAL / INCONCLUSIVE). Register gaps with Confluence + `source_profile.json` citations and severity (high/medium/low).

**Linear:** Read `agent/prompts/linear-config.json`. For each **high** or **medium** gap, create a Linear issue or, if config is `TBD`, write `discoveries/linear-drafts/{discovery-id}.md`.

**Notify:** Read `agent/prompts/notify-config.json`. For P0 blockers and client decisions, notify per rules or write `discoveries/notify-drafts/{issue-id}.md` when emails are `TBD`.

Citation discipline: executive prose first; evidence in gap table (`CONF:…`, `DATA:…`).

## Done when

- `discoveries/demo-session-findings.md` — sponsor-readable, sample boundary stated, updated in the document pane through the session
- `discoveries/intent/intent-comparison-report.md` and `discoveries/segments/*.md` — linked from the executive summary
- `discoveries/linear-drafts/` — one draft (or live Linear issue) per high/medium gap
- `discoveries/notify-drafts/` — drafts for P0 / decision-needed items (minimum)
- Optional rollup: `discoveries/analysis-findings-report.md` if you consolidate for git

Optional skills if stuck on one domain: `ptree-segment-data-analyst`, `ptree-intent-comparison-analyst` under `agent/skills/`.
```
