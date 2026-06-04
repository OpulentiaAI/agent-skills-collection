# PartsTree Migration Analysis — Master Brief

**Purpose:** A single reference for running a Catalog DB → Shopware migration assessment in a fresh agent session. For **client demos**, use the tight copy-paste brief in [demo-client-brief.md](./demo-client-brief.md) — not Part 6 of this file. Use this master brief for methodology, citation discipline, and full-depth engagements.

**Audience:** Analysts and agents producing client-facing migration findings. Tone is evidence-led and professional — suitable for a demo or steering review, not an internal compliance checklist.

---

## Part 1 — Context & role

### What this engagement is

PartsTree is moving catalog data from a MongoDB-style source (BSON export) into Shopware. The Confluence architecture export describes the **target state**: hierarchy, sync model, custom fields, IPL/media handling, workflow flags, and scale expectations. The client sample archive is the **measured reality** available today.

Your job is to compare plan to data: quantify what the sample shows, name where it diverges from the documented intent, and explain what that means for migration feasibility — without inventing numbers or leaning on prior consulting automation as proof.

### What "done" looks like

A complete analysis gives stakeholders:

- Confidence in **what was measured** (snapshot integrity, sample vs production boundary)
- A **governed metrics layer** so counts and rates can be recomputed
- **Segment-level notes** across the major catalog domains
- An **intent comparison** (plan vs data) with honest status labels
- A **gap register** linking each finding to Confluence text and data evidence
- **Transform feasibility notes** where mapping dry-runs exist
- An **executive summary** a non-technical sponsor can read in ten minutes

You are not certifying gates, approving loaders, or closing open decisions. You are producing a credible assessment the client can act on.

### Scope boundary (especially client demo)

Stay inside **`client-data/`** and **`discoveries/`** outputs unless blocked. Do not treat broad repo exploration, `agent/skills/reference/`, `notes/post-mortem/`, assessment script spelunking, or historical consulting artifacts as primary work — only open them if the user asks or a specific gap cannot be resolved from the PDF + sample profile.

### Time-box discovery (client demo)

Orient quickly: confirm the Confluence PDF and sample zip exist, record a short snapshot manifest, run **one** profile pass, then analysis. The first in-session deliverable should be an **intent-comparison skeleton** plus at least one segment note stub; deepen from there. Do not reward long exploration passes — depth should show up in evidence and gaps, not step count.

---

## Part 2 — Source materials

### Primary evidence (use these for conclusions)

All paths below are relative to the **`ptree-new-migration-docs-and-skills/`** package unless noted as **repo root** (AltusNova).

| Material | Location | Role |
|----------|----------|------|
| Confluence export | `client-data/confluence/Confluence-PTREE-010626-130110.pdf` (package); or `agent-skills-collection/docs/` copy; or AltusNova `docs/` mirror | Target-state intent: hierarchy, Shopware MVP, media/CDN, workflow, sync, scale |
| **Data extracts (primary)** | `client-data/extracts/` — `overview.md`, `source_profile.json`, `manifest.json`, `samples/*.jsonl` | Governed metrics without LFS; regen via `python3 agent/scripts/build_data_extracts.py` from package root |
| Sample archive (optional) | `agent-skills-collection/docs/input-sample-data.zip` (collection root, LFS) | Outer zip → `Opulent/catalog.zip` → BSON members |
| Local BSON extract (optional) | `client-data/snapshot/` | On-disk BSON for dry-runs; see `client-data/sample/README.md` |
| Overview narrative (supplementary) | `client-data/snapshot/Opulent/partstree_catalog_shopware_overview.md` or inside the outer zip | Helpful when the PDF is silent; not a substitute for the PDF |

**Evidence rule:** Conclusions about migration readiness should trace to the PDF and/or measurements you derive from the sample in this run. Treat everything else as context or prior art — useful for orientation, not proof.

**Known baseline findings (demo / steering):** Before deep discovery, read [`agent/prompts/known-findings-context.md`](./known-findings-context.md) for the measured findings table (16 rows), sponsor executive summary, and instructions for natural-language delay narratives (record under `discoveries/demo-session-findings.md` → `## Delay and misstep narrative`). Define jargon on first use from [`notes/glossary-and-findings.md`](../notes/glossary-and-findings.md) Part 1. Re-validate all counts against `client-data/extracts/source_profile.json` in this run; findings are expected context, not secrets.

### What not to treat as primary proof

Prior automation outputs (gate verdicts, batch agent JSON, open-decisions registers, consulting-only blocker lists) may describe the same themes you will find, but they are not measurements. If you reference a human decision label (e.g. a model-mapping fork), pair it with the Confluence option text and a data metric from this run — not the register row alone.

Likewise, do not claim production DocumentDB parity, live Shopware state, or full-corpus load readiness from the sample alone.

### Profiling responsibly

**Snapshot integrity:** Record what you opened. A simple manifest with outer-archive checksum, inner zip member list, and any missing collections (e.g. `assets.bson`, `attributes.bson` if absent) protects the analysis from "which zip was this?" drift. Example path: `client-data/manifests/source_snapshot_manifest.json`.

**Sample boundary:** State explicitly that the archive is a **measured sample**, not a proven production freeze, until the client delivers and checksums a production cut. Profile output should carry a verdict like `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` when that remains true.

**How to measure:** The repo includes helpers you can use when helpful:

- **`build_data_extracts.py`** (`agent/scripts/build_data_extracts.py`) — refreshes `client-data/extracts/` from the sample archive
- **`profile_source_bson.py`** (`agent/scripts/profile_source_bson.py`, run from **package root**) — streams BSON; writes `discoveries/profiles/source_profile.json` (also mirrored in extracts when regen)
- **Optional extract** — only if you need on-disk BSON for transform dry-runs: unzip to `client-data/snapshot/` and checksum key members
- **Spot checks** — a handful of documents per collection to illustrate shape; **counts and rates come from the profile**, not manual guessing

If the PDF binary is unreadable, say so, extract or use a trusted in-repo derivative, and note the limitation in your provenance section. Do not backfill Confluence intent from gate files or agent verdict JSON.

---

## Part 3 — Discovery tracking

Good analysis accumulates discoveries as you go — not as a final checkbox pass.

### Discovery log format

Maintain a working log (markdown table or TSV). Each row is one finding worth remembering:

| Field | Purpose |
|-------|---------|
| `id` | Stable id, e.g. `DISC-001` |
| `observation` | What you saw, in plain language |
| `evidence` | Pointers to Confluence section and/or profile metric path |
| `confidence` | `high` / `medium` / `low` — sample limits, missing collections, ambiguous PDF language |
| `open_question` | Decision or deliverable needed from the client, if any |

Example:

| id | observation | evidence | confidence | open_question |
|----|-------------|----------|------------|---------------|
| DISC-003 | Sample has no `assets.bson`; IPL and photo refs cannot resolve to media rows | Confluence Media/CDN section; `source_profile.json` assets status | high | Client to deliver assets collection or CDN contract |
| DISC-007 | ~20% of parts lack a `stock` join target | `parts_with_empty_stock_rate` in profile | high | Stock fallback policy for migration |

Roll discoveries forward into segment notes, the gap register, blocker/delay narrative, and the executive summary. Avoid maintaining parallel consulting-only artifacts that duplicate the same finding without new evidence.

### Evidence ledger (citation discipline)

Citations should read like footnotes in a consulting memo, not tags in every sentence.

- In prose, write naturally: *"Confluence describes a six-level merchandise tree (Brand → … → Parts)."*
- Attach evidence in a **ledger** at section end, table footnotes, or an `evidence_index`-style appendix: gap id → Confluence location → data metric → severity.
- Use short citation keys when precision matters: Confluence as `CONF:Catalog hierarchy` or `CONF:p.61–65`; data as `DATA:products.count` or a path into `source_profile.json`.

The goal is **traceability**, not token density. A reader should be able to recompute any rate from the profile and find the matching plan statement in the PDF.

---

## Part 4 — Analysis best practices

These are principles, not a numbered pipeline.

### Compare intent to reality explicitly

Extract testable statements from the Confluence export: hierarchy shape, Shopware entities and custom fields, media/CDN path, cataloger workflow, sync vs baseline ETL, deterministic IDs, scale figures. For each, ask what the sample would need to look like if the plan were already true — then measure.

Status labels (`PASS`, `GAP`, `PARTIAL`, `INCONCLUSIVE`) are fine when defined honestly. `INCONCLUSIVE` is preferable to a forced PASS when assets are missing or the sample cannot represent production.

### Segment the domain

Work across the major catalog concerns without forcing a rigid file count:

- **Products & parts** — counts, types, stock references, photos
- **Models & IPL** — model grain, IPL refs, mapping to Shopware categories/custom entities
- **Inventory** — row counts, qty/NLA semantics, price parse health
- **Workflow & meta flags** — deleted, approved, sync-oriented fields vs Confluence workflow
- **Stock joins** — product↔inventory linkage, orphans, fallback behavior
- **Media & IPL** — assets presence, empty photo rates, broken joins
- **Brand / hierarchy signals** — equipment type, separate hierarchy collections vs collapsed product grain

One note per segment is typical; combine or split if the data story demands it. Prior runs used `discoveries/segments/{segment}.md` — follow that pattern if it helps.

### Quantify before narrating

Define metrics with numerator, denominator, and grain (part vs model vs inventory row). Anchor values in `source_profile.json` or transform dry-run output. Call out **limitations** beside every headline number: absent collections, policy masks in dry-runs, sample size caps.

### Separate facts, inferences, and decisions

| Type | Example |
|------|---------|
| **Fact** | "Sample contains 4,759,440 part documents." |
| **Inference** | "Empty stock on ~20% of parts likely blocks a strict join-first load unless policy allows fallback." |
| **Decision needed** | "Confluence offers two model-mapping options; sample block rate differs materially by option." |

Do not present policy-masked transform success as production load readiness.

### Diagrams when they clarify impedance

When plan and data shapes diverge, a simple diagram often beats a page of prose. Useful subjects: current single-collection model vs target hierarchy; IPL/media join with missing assets; workflow flags vs sync pipeline. Caption each figure with what Confluence claims and what the sample measured.

### Adversarial honesty

For each encouraging signal, note one way it could mislead: sample ≠ prod, a fallback policy hiding gaps, a threshold met at the wrong grain. Sponsors trust analysts who state boundaries upfront.

---

## Part 5 — Expected outputs

A thorough run typically produces the artifacts below. Paths are **examples** under `discoveries/` — sensible naming and consolidation are fine if cross-links stay clear.

| Outcome | Example path | What it contains |
|---------|--------------|------------------|
| Snapshot manifest | `source_snapshot_manifest.json` | Checksums, member list, missing collections |
| Compiled profile | `source_profile.json` | Machine-readable counts, rates, join metrics, profile verdict |
| Semantic layer | `semantic-layer.md` | Metric definitions, intent registry, segment map |
| Segment notes | `discoveries/segments/*.md` | Per-domain metrics, observations, limitations |
| Intent comparison | `discoveries/intent/intent-comparison-report.md` | Plan statement vs measurement vs status |
| Live demo session doc | `discoveries/demo-session-findings.md` | Native document pane deliverable during client demo |
| Gap narrative | `client-data-gap-profile.md` | Readable story of plan/data friction |
| Gap register | `gap-citation-matrix.md` or ledger section | Each gap linked to Confluence + data evidence |
| Transform notes | `discoveries/assessment/output/transform_stats.json` + short interpretation | Sample dry-run success/error breakdown, policy masks documented |
| Blocker / delay view | `blocker-delay-matrix.tsv`, `blocker-delay-narrative.md` | Discoveries mapped to timeline themes (e.g. recovery vs delayed path) |
| Schema impedance diagrams | `schema-difficulty-diagrams.md` | Mermaid or equivalent with captioned CONF vs DATA |
| Executive rollup | `analysis-findings-report.md` | Ten-minute sponsor read: top signals, provenance, links inward |

Not every engagement needs every file on day one. **Do** need: provenance, governed metrics, intent comparison, gap register with dual evidence, and an executive summary that states sample boundaries.

Optional: a short appendix on agent-fleet / batch orchestration — clearly labeled **playbook, not evidence** — if stakeholders want to see how findings would feed a gated migration program.

| Reporting artifact | Example path |
|--------------------|--------------|
| Linear issue drafts | `discoveries/linear-drafts/{discovery-id}.md` |
| Stakeholder notify drafts | `discoveries/notify-drafts/{issue-id}.md` |

---

## Part 5b — Reporting findings (demo & steering)

After gaps are registered, route **material** findings (severity **high** or **medium**) into Linear and stakeholder channels. Config is placeholder until the demo — fill before go-live.

### Linear issues

1. Read `agent/prompts/linear-config.json` (`team_id`, `project_id`, `label`, `issue_template`).
2. For each high/medium gap, create an issue with: **title**, **discovery ID** (`DISC-###` or gap id), **client citation** (Confluence section / page), **data metric** from `source_profile.json`, **recommended owner role** (e.g. client data, Shopware, integration), **suggested priority**.
3. If any config value is `TBD`: write full issue bodies under `discoveries/linear-drafts/` as markdown the user can paste into Linear. **Also** attempt Linear API or MCP create if the session has credentials — do not block analysis on API availability.

### Stakeholder notification

1. Read `agent/prompts/notify-config.json` (`stakeholders`, `message_template`).
2. For **key issues** — P0 blockers, missing client deliverables (e.g. assets), decisions flagged in open questions (e.g. OD-01) — send a concise email- or Slack-style summary per `notify_on` rules.
3. If `email` is `TBD`: write drafts to `discoveries/notify-drafts/{issue-id}.md` using `message_template` fields. User sends manually after filling contacts.

**Fill before demo:** replace `TBD` in both JSON files; create `discoveries/linear-drafts/` and `discoveries/notify-drafts/` as needed.

---

## Part 6 — Copy-paste agent brief

**Client demo:** copy from [demo-client-brief.md](./demo-client-brief.md) (canonical, time-boxed, extracts-first, **native document pane** at `discoveries/demo-session-findings.md`). Do not duplicate the fenced brief here.

**Full-depth session:** use the demo brief as a floor, then follow Parts 3–5 and Part 5b; optional transform dry-run and blocker-delay narrative when stakeholders need load-program depth.

---

## Part 7 — Optional reference

<details>
<summary>Repo helpers, commands, and prior examples (expand if needed)</summary>

### Skills

Index: `agent/skills/README.md` · Authoring: `agent/skills/SKILL-AUTHORING.md`

| Skill | Path | Use when |
|-------|------|----------|
| Segment analyst | `agent/skills/ptree-segment-data-analyst/SKILL.md` | Deep dive on one catalog domain |
| Intent comparison | `agent/skills/ptree-intent-comparison-analyst/SKILL.md` | Plan vs measured status |
| Blocker / delay mapper | `agent/skills/ptree-blocker-delay-mapper/SKILL.md` | Tie discoveries to timeline narrative |
| Evidence-driven migration | `agent/skills/evidence-driven-migration/SKILL.md` | Contracts, dry-run, load program |
| Agentic orchestration | `agent/skills/agentic-migration-orchestration/SKILL.md` | Multi-session migration coordination |
| Human escalation | `agent/skills/human-escalation-judgment/SKILL.md` | Pause vs proceed on irreversible steps |

**Reference (optional):** `agent/skills/reference/pstack/` (audit trail, verify artifacts), `reference/mongodb/` (BSON schema), `reference/aws/` (S3, EventBridge topology). Do not treat reference skills as client evidence.

### Useful commands

| Action | Command |
|--------|---------|
| Archive checksum | `shasum -a 256 input-sample-data.zip` (from `agent-skills-collection/docs/`) |
| List zip members | `unzip -l input-sample-data.zip` |
| Regen extracts (package root) | `python3 agent/scripts/build_data_extracts.py` |
| Profile sample (package root) | `python3 agent/scripts/profile_source_bson.py` |
| Transform dry-run (package root) | `node discoveries/assessment/scripts/run_transform_dry_run.mjs` |
| Self-service checklist | `node agent/scripts/run_self_service_analysis.mjs` |

Transform dry-run environment knobs (document in write-up if used): `OD01_DECISION`, `PUBLICATION_POLICY`, `STOCK_FALLBACK`, `CDN_BASE`.

### Example outputs (structure reference)

- [analysis-findings-report.md](analysis-findings-report.md) — executive rollup
- [semantic-layer.md](semantic-layer.md) — metrics and intent registry
- [intent/intent-comparison-report.md](../discoveries/intent/intent-comparison-report.md) — PASS/GAP/PARTIAL table
- [demo-session-findings.md](../discoveries/demo-session-findings.md) — live document pane session rollup
- [client-data-gap-profile.md](client-data-gap-profile.md) — narrative gaps
- [schema-difficulty-diagrams.md](schema-difficulty-diagrams.md) — impedance diagrams
- [analysis-self-service-guide.md](analysis-self-service-guide.md) — governed Q→metric workflow

### Citation keys (quick reference)

| Type | Example |
|------|---------|
| Confluence | `CONF:Catalog hierarchy`, `CONF:p.61–65 custom fields` |
| Overview md | `CONF:overview.md#Hierarchy` |
| Profile / BSON | `DATA:products.count`, `DATA:profile.parts_with_empty_stock_rate` |
| Transform stats | `DATA:transform.blocked_no_media` |

### Playbook (not client evidence)

- `discoveries/matrices/agent-workstream-matrix.csv` — role names for "who would catch this" in recovery narrative
- `notes/post-mortem/ptree-migration-postmortem-report.md` — theme structure for delay storytelling; re-derive discoveries from CONF + DATA

</details>

---

**Maintainers:** When metrics, segments, or assessment outputs change, update Part 5 example paths and Part 7 references alongside `semantic-layer.md`. Edit the demo brief in `demo-client-brief.md` when the evidence contract or workspace layout changes; keep this file's Part 6 as a pointer only.
