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

**Baseline findings & glossary:** `agent/prompts/known-findings-context.md` (findings table + sponsor summary) · full terms `notes/glossary-and-findings.md`

Write analysis under `discoveries/` and manifests under `client-data/` only.

## Known baseline findings

Expected demo context — **not secrets**. Re-validate metrics from `client-data/extracts/source_profile.json` (and transform stats when cited); note if numbers drift from the baseline below. Full table and sponsor narrative: `agent/prompts/known-findings-context.md` · glossary: `notes/glossary-and-findings.md`.

| Measured stat (baseline) | Blocker theme |
|--------------------------|---------------|
| **5.14M** products (4.76M parts, 383K models), polymorphic collection | Collapsed hierarchy |
| `hierarchy_collections_present=false`; **93.0%** empty `equipment_type` | Collapsed hierarchy |
| Model mapping undecided; **92.3%** model sample blocked | Model mapping decision |
| `assets.bson` missing; **355,939** products with `ipl[]` | Missing assets export |
| `CDN_BASE` null; **20.65%** part sample blocked_no_media | Missing assets export / CDN contract |
| **89.9%** empty `photos[]` (~520K non-empty refs) | Missing assets export |
| **438,979** soft-deleted (**8.5%**) | Publication & workflow mapping |
| `meta.*` vs Confluence workflow field names | Publication & workflow mapping |
| `attributes.bson` missing | Missing attributes export |
| **973,287** parts (**20.4%**) empty `stock` | Stock & inventory contract |
| **75.4%** inventory missing `quantity_on_hand`; **70.9% NLA** | Stock & inventory contract |
| **3,670** unparseable inventory prices | Data quality — pricing |
| **81.1%** stock join_ok (masks empty-stock gap) | Stock & inventory contract |
| **71.6%** transform sample success; **28.37%** blocked/skipped | Transform verification |
| `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` | Production source boundary |
| **5.14M** docs — full-document EventBridge risk | Compact ongoing sync design |
| Part count PASS (4.76M &gt; 4.4M plan) — informational only | *(scale OK, not load-ready)* |

Use **blocker theme** names in executive prose; put `DISC-*` IDs only in appendix or discovery log tables, not headline labels.

## How to explain delays and missteps

For each **material blocker** you confirm in this session, add sponsor-readable **prose** (paragraphs, not bullets-only) under `## Delay and misstep narrative` in `discoveries/demo-session-findings.md`. For each theme explain:

1. **Sequencing / contract failure** — what the program likely did wrong (e.g. Batch D loaders before mapping freeze, media batch without `assets.bson`, treating dry-run fallback as parity).
2. **Calendar impact** — how that pattern drives nine months of rework vs a gated **twelve-week replay** (profile week 1 → mapping week 2 → assets week 4 → verified dry-run weeks 5–6 → loaders).
3. **Week 1–4 prevention** — the stop condition or signed deliverable that would have surfaced the issue before loaders (production freeze, model mapping decision, assets/CDN manifest, publication policy, transform hash ledger).

On **first use** of domain terms, spell them per Part 1 glossary (e.g. **IPL (Illustrated Parts List)**, **compact EventBridge event**, **STOCK_FALLBACK**, **Catalog DB**). Tone: calm, evidence-led, sequencing-focused — not blame. Tie claims to refreshed profile/transform paths; if baseline numbers drift, say so explicitly.

## Do NOT explore

- Broad repo walk, gate files, batch agent JSON, consulting registers, or post-mortem/historical notes unless the user explicitly asks
- `agent/skills/reference/`, `notes/post-mortem/`, assessment code spelunking, or transform dry-runs unless blocked on a specific gap
- Treating prior automation output as proof — re-derive metrics from the PDF + this session's extracts/profile

## Time-box discovery

Confirm Confluence PDF + `client-data/extracts/` exist (regen extracts if missing). Use `extracts/source_profile.json` for metrics; profile BSON only if integrity fails. One orientation pass, then analysis.

## Recording findings (native document pane)

**Primary working surface:** Cursor's **native document pane** — create and edit markdown in the workspace so the sponsor sees live progress in the editor, not chat-only summaries.

1. Open or create **`discoveries/demo-session-findings.md`** at session start and keep it updated continuously.
2. Structure (top → bottom): **executive summary** (refresh as you learn) → **discovery log** (`DISC-###`) → **intent comparison table** → **gap register** (severity, dual citations) → **`## Delay and misstep narrative`** (prose per material blocker; see above).
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
