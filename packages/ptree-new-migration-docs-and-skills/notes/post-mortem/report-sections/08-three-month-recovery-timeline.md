# 8. Three-Month Recovery Timeline

This section defines a **twelve-week recovery calendar** that replays the PartsTree Catalog DB → Shopware migration using the gated agent control plane documented in `agent-workstream-matrix.csv`, `agent-batch-launch-plan.md`, and `verification-gates.csv`. The timeline is not a wish list of parallel engineering tasks; it is a **sequenced proof chain** in which each batch produces inspectable artifacts, human decision points close before loaders run, and independent reconciliation—not agent summaries—certifies progress.

The contrast baseline is the **nine-month actual**: architecture and transforms advanced while G0–G3 remained open, `assets.bson` never entered the source manifest, Confluence **Option 1 vs Option 2** (model→category vs custom entity) stayed undecided through month seven, and G4 passed on summary JSON without hash ledgers or `dry_run_reconciliation.json`. Recovery compresses discovery, contract freeze, dry-run proof, dev baseline, staging/prod cutover, and ongoing-sync **design** into one quarter—only if gates are enforced and loaders stay blocked until Batch C returns `VERIFIED`.

---

## Critical path (non-negotiable)

Three dependencies dominate every week on the calendar:

1. **Gates before loaders (G0–G4 → then Batch D).** The workstream matrix and repo `AGENTS.md` rule are explicit: Manufacturer/Brand, Category/Model, Product, Inventory, and Media/IPL loader agents must not launch until Batch C independent verification marks dry-run gate **VERIFIED**. In the nine-month run, 24 of 26 agent roles were blocked while transforms and Lambda/EventBridge work continued anyway—rework without a target read-back baseline.

2. **Option 1/2 decision week (target week 2).** Open decision **OD-01** blocks **141,758** of **382,743** model rows in dry-run (`dry-run-groups.csv`). Sample transform runs show **92.3%** of non-deleted models blocked pending mapping. The Human Domain Owner must choose Confluence Option 1 (models as categories under brand hierarchy) or Option 2 (models as custom entities / alternate graph) **before** Mapping Contract Agent can publish zero-blocker `mapping_contract.csv` and before Target Schema Contract Agent can smoke category vs entity write paths (G2, G3).

3. **Assets contract week (target weeks 3–4).** Media/IPL Contract Agent deliverables (`media_ipl_contract.csv`, `cdn_resolution_report.csv`) depend on `assets.bson` presence or **approved deferral** in `source_snapshot_manifest.json`. The nine-month archive never included full assets; **18.8%** of sample parts with `photos[]` refs were `blocked_no_media`, and media/IPL loader rows show **zero** locally loadable candidates. Week 3–4 is the hard stop: either restore and checksum assets, or defer IPL/media scope with signed impact on G5 load order and storefront completeness.

Supporting gates thread through the same spine: **G0** access and source freeze (Batch A), **G1** measured profile from real BSON (Batch B Source Profile), **G2** approved mapping (Batch B Mapping), **G3** writable Shopware paths (Batch B Target Schema + Batch A Target Shopware), **G4** deterministic payloads and terminal row statuses (Batch C), **G5** dev reconciliation (Batch D), **G6–G7** staging then prod with human cutover (Batch E), **G8** sync idempotency (Batch F after baseline proven).

---

## Agent fleet overview

The recovery plan deploys **26 specialized agents** in six batches (A–F), plus a Lead Orchestrator and Human Migration Lead for stop/go. Batch A fans out four parallel discovery agents; Batch B four contract agents; Batch C four dry-run agents (Independent Verification runs after peer artifacts exist); Batch D five loader layers each followed by reconciliation; Batch E four staging/prod agents; Batch F four ongoing-sync agents. Every child returns structured JSON (`verdict`, `artifacts`, `blockers`, `open_questions`, `next_batch_ready`); the parent rejects summary-only outputs and runs `node agent/scripts/verify-gates.mjs` to refresh `gate_verdicts.tsv`.

---

## Week 0–12 calendar

### Week 0 — Program reset and orchestration

**Batch:** Setup (no agent fanout yet).  
**Activities:** Assign owners to `open_decisions.tsv` (15 of 17 lacked owners in Batch A evidence). Wire secrets per `secrets_readiness.md`. Confirm sample vs production BSON boundary (**OD-16**).  
**Deliverables:** Migration lead charter, decision RACI, empty `gate_verdicts.tsv` baseline.  
**Decision point:** Go/no-go on **production** source freeze date vs continued sample profiling.  
**Gate target:** None (prerequisite week).

*Nine-month contrast:* Weeks 1–4 of the original Confluence plan proceeded on hierarchy diagrams without measured BSON or assets export—same failure mode if Week 0 is skipped.

---

### Week 1 — Batch A: discovery gates (G0 foundation)

**Batch A (parallel):** Access/Infra Agent, Source Snapshot Agent, Target Shopware Agent, Project Evidence Agent.

| Agent | Deliverables | Gate |
|-------|----------------|------|
| Access/Infra | `access_matrix.csv`, `quota_limits.md`, `secrets_readiness.md`, `environment_matrix.csv` | G0 inputs |
| Source Snapshot | `source_snapshot_manifest.json`, `restore_proof.md` | G0 inputs |
| Target Shopware | `shopware_schema_snapshot.json`, `api_smoke_results.json` | G3 prep |
| Project Evidence | `evidence_index.md`, `open_decisions.tsv` | Escalations |

**Verification:** Lead Orchestrator inspects artifacts; deferrals require owner + scope impact. Source Snapshot must list every in-scope collection with checksum—or defer `assets`/`attributes` explicitly, not silently.  
**Stop condition:** Any required service unknown without approved deferral (matrix stop rules).  
**Gate target:** **G0** — access and source freeze VERIFIED or deferred.

*Nine-month contrast:* G3 remained **0/4** artifacts for months; OAuth and schema smoke never completed. Week 1 must end with Shopware reachable or a documented blocker, not “assume Admin API.”

---

### Week 2 — Batch B (phase 1): profile + **Option 1/2 decision week**

**Batch B (parallel, after Batch A inspected):** Source Profile Agent, Mapping Contract Agent, Target Schema Contract Agent, Media/IPL Contract Agent (contract drafting only).

**Human decision point (critical):** **OD-01 / Confluence Option 1 vs Option 2** — model→category vs custom entity. Record in `mapping_approval_record.md`. Without this, Mapping Contract Agent cannot clear blocker rows; **141K+** models stay `BLOCKED_PENDING_OD-01`.

| Agent | Deliverables | Gate |
|-------|----------------|------|
| Source Profile | `source_profile.json`, `source_join_report.csv`, `source_quality_issues.sqlite` | **G1** |
| Mapping Contract | `mapping_contract.csv` (in progress), `mapping_open_questions.tsv` | **G2** |
| Target Schema Contract | `custom_field_diff.csv`, `plugin_health_report.md` | **G3** |
| Media/IPL Contract | `media_ipl_contract.csv` draft | Pre–assets week |

**Secondary decisions (same week if possible):** OD-06 publication semantics (438,979 deleted; 26,545 unapproved), OD-04/OD-05 stock/qty fallback policy (2.74M missing `quantity_on_hand`).  
**Gate targets:** **G1** VERIFIED from **real records** (not metadata-only estimates); G2/G3 in progress.

*Nine-month contrast:* OD-01 open months 2–7 while Lambdas and transforms churned. Week 2 concentrates architecture decisions that were deferred until loaders failed.

---

### Week 3 — Batch B (phase 2): mapping + target contract freeze

**Focus:** Complete **G2** and **G3** with zero blocker rows on approved mapping paths.

| Deliverable | Owner | Pass condition |
|-------------|-------|----------------|
| `mapping_contract.csv` | Mapping Contract + Human Domain Owner | Zero unresolved blocker rows |
| `mapping_approval_record.md` | Human Domain Owner | Sign-off |
| `shopware_schema_snapshot.json` + smoke | Target Schema / Target Shopware | Every approved target path writable |
| `plugin_health_report.md` | Target Schema | IPL plugin (`PartsTreeIplPlugin`) health |

**Gate targets:** **G2**, **G3** VERIFIED.  
**Inspection:** Independent Verification Agent cross-checks mapping rows against schema snapshot (no starter CSV with 11 rows substitute).

*Nine-month contrast:* Only `mapping-contract-starter.csv` existed; G2 FAIL. Recovery week 3 promotes starter to approved contract or stops Batch C.

---

### Week 4 — **Assets contract week** + Batch B closeout

**Media/IPL Contract Agent** leads: finalize `media_ipl_contract.csv`, `cdn_resolution_report.csv`.

**Decision point:** Full `assets.bson` restored into snapshot **or** approved deferral (IPL/media loads deferred; DQ queue documents `blocked_no_media` scope). Align with CLI-009/CLI-010 evidence: ~520K products carry `photos[]`; without assets, a double-digit percent of parts cannot load media.

**Deliverables:** Updated `source_snapshot_manifest.json` if new collections land; CDN resolution proof; explicit batch-order impact for Batch D layer 9 (Media/IPL Loader).  
**Gate targets:** G0 deferrals closed or accepted; Batch B `next_batch_ready=true` for all four agents.

*Nine-month contrast:* Assets export late or absent; media/IPL loaders designed against 81 staging metadata stubs. Week 4 forces source-to-target media contract before normalization at scale.

---

### Week 5 — Batch C (phase 1): normalization + DQ

**Batch C (parallel, after Batch B approved):** Normalization Harness Agent, Data Quality Queue Agent, Batch Manifest Agent; Independent Verification Agent prepares checklists.

| Agent | Deliverables | Gate contribution |
|-------|----------------|-------------------|
| Normalization Harness | `normalized_payloads/`, `payload_hash_ledger.sqlite` | G4 |
| Data Quality Queue | `quality_issue_counts.csv`, `quality_issue_samples.csv` | G4 |
| Batch Manifest | `batch_manifest.csv`, `batch_order.md` | G5 prep |

**Rules:** Every source row gets terminal status: `READY_TO_LOAD`, `REJECTED_WITH_REASON`, or `DEFERRED_WITH_APPROVAL`. No `UNKNOWN`. Payload hashes **deterministic across reruns**.  
**Scale note:** `quota_limits.md` from Batch A informs sync API batch sizing for ~4.4M loadable parts.

*Nine-month contrast:* G4 PASS from artifact presence only; no hash ledger. Week 5–6 require two-run determinism evidence.

---

### Week 6 — Batch C (phase 2): independent verification (**G4**)

**Independent Verification Agent:** `dry_run_reconciliation.json`, updated `gate_verdicts.tsv`.

**Pass condition (G4):** No unclassified failures; `dry_run_reconciliation.json` matches `verification-gates.csv`; reconciliation agent verdict **VERIFIED**.

**Parent action:** Run `verify-gates.mjs`; **do not launch Batch D** unless G0–G4 VERIFIED or human-migration-lead deferral on record.

**Deliverables:** `migration_ledger.sqlite` (per gates CSV), classified DQ for 323,782 blocked parts and deferred models/media per contract.

*Nine-month contrast:* 28.4% error/skip rate in sample transform without row-level ledger. Week 6 makes dry-run the last gate before any Shopware write.

---

### Week 7 — Batch D (layers 1–3): brands, categories/models, reconciliation

**Loader sequence (dependency order per launch plan):**

1. Manufacturer/Brand Loader Agent → `brand_load_ledger.sqlite`  
2. Reconciliation Agent (brands)  
3. Category/Model Loader Agent → `category_model_load_ledger.sqlite` (~241K loadable models after OD-01)  
4. Reconciliation Agent (categories/models)

**Gate target:** **G5** in progress — dev environment only.  
**Prerequisites:** `batch_manifest.csv` hash order; brand de-dupe policy (**OD-10**) frozen.

*Nine-month contrast:* Category/model loaders designed while OD-01 open. Week 7 assumes mapping and schema smoke already proved paths.

---

### Week 8 — Batch D (layers 4–6): products, inventory, first reconciliation pass

1. Product Loader Agent → `product_load_ledger.sqlite` (~4.44M loadable parts per dry-run)  
2. Reconciliation Agent (products)  
3. Inventory Loader Agent → `inventory_load_ledger.sqlite`  
4. Reconciliation Agent (inventory)

**Issues actively managed:** Stock join fallbacks (973K empty `stock`, 2.74M missing qty), price parse failures (3,670), publication gating per OD-06.

**Deliverables:** `dev_load_ledger.sqlite`, partial `dev_target_reconciliation.json`, `dev_shopware_api_samples/`.

---

### Week 9 — Batch D (layer 7–8): media/IPL + **G5** close

1. Media/IPL Loader Agent → `media_load_ledger.sqlite`, `ipl_load_ledger.sqlite` (if assets contract satisfied)  
2. Independent Reconciliation Agent → `dev_reconciliation_report.json`

**Gate target:** **G5** VERIFIED — source ready count equals target load/read count; hashes and API samples pass.

**Stop condition:** Missing asset/plugin/association errors above threshold → halt, DQ replay, not prod discussion.

*Nine-month contrast:* Media/IPL showed zero loadable rows locally. Week 9 may complete with explicit deferral if Week 4 deferral was approved—still reconciled, not ignored.

---

### Week 10 — Batch E (staging): **G6**

**Sequential:** Staging Load Agent → `staging_load_ledger.sqlite`; Staging Verification Agent → `staging_reconciliation_report.json`.

**Rule:** Same scripts and manifests as dev—no staging-specific improvising (`agent-batch-launch-plan.md`).

**Gate target:** **G6** VERIFIED; no unexplained drift vs dev.

**Parallel (allowed):** Batch F **paper design** — Event Contract Agent may draft `sync_event_contract.json` (compact ID-only events per assessment IM-005); implementation still blocked on G5–G7.

---

### Week 11 — Batch E (prod prep) + human cutover packet

**Activities:** Prod Load Agent preparation; Prod Verification Agent checklist; `cutover_decision_record.md` draft.

**Human decision point:** Cutover window, rollback triggers, delta strategy—**Human Migration Lead** approval required before prod execution.

**Gate target:** Staging evidence reviewed; **G7** prerequisites documented.

*Nine-month contrast:* Prod discussions began without staging reconciliation. Week 11 is evidence review, not “run it and fix.”

---

### Week 12 — Batch E (prod) + Batch F foundation (**G7–G8**)

**Sequential (after human approval):** Prod Load Agent → `prod_load_ledger.sqlite`; Prod Verification Agent → `prod_reconciliation.json`, signed `cutover_decision_record.md`.

**Batch F (parallel launch after mapping/normalization contract approved, baseline G5–G7 proven):** Event Contract, Sync Processor, DLQ/Replay, Daily Reconciliation agents.

| Agent | Deliverable | Gate |
|-------|-------------|------|
| Event Contract | `sync_event_contract.json` | G8 input |
| Sync Processor | `sync_processor_ledger.sqlite`, `duplicate_event_test.json` | G8 |
| DLQ/Replay | `dlq_replay_runbook.md`, `replay_test.json` | G8 |
| Daily Reconciliation | `daily_reconciliation_report.json` | G8 |

**Gate targets:** **G7** prod baseline VERIFIED; **G8** duplicate/replay/drift tests passing (ongoing sync operational readiness, not full 5M/day production load on day 90).

**Program outcome:** Baseline migration complete with terminal row states; sync architecture idempotent; daily reconciler explains drift.

---

## Nine months vs twelve weeks (summary contrast)

| Dimension | Nine-month actual (inferred) | Twelve-week recovery |
|-----------|------------------------------|----------------------|
| Week 1–4 | Confluence architecture, Shopware design without BSON profile | Batch A G0 + measured G1 |
| Months 2–4 | Transform/Lambda churn; OD-01, assets, meta.\* open | Weeks 2–4 decisions + contracts |
| Months 4–7 | G3 0/4; loaders unverifiable | G3 smoke week 3; loaders week 7+ only |
| Months 7–9 | Stock/media/publication rework; G4 summary-only | G4 hash + reconciliation week 6 |
| Parallelism | 24/26 agents BLOCKED; work continued anyway | Launch only current independent batch |
| Batch F | Infra scoped before baseline proof | Paper week 10; impl week 12 after G5–G7 |

The three-month plan is achievable **only** as a gated replay: access and snapshot first, human mapping decisions in week 2, assets contract in week 4, dry-run proof in week 6, then dependency-ordered dev loads, staging, prod, and sync contracts. Skipping any critical-path week reproduces the nine-month timeline with extra reporting overhead.

---

## Decision and deliverable register (quick reference)

| Week | Decision / gate | Primary deliverables |
|------|-----------------|----------------------|
| 0 | Production vs sample scope | RACI, decision owners |
| 1 | G0 deferrals | `access_matrix.csv`, `source_snapshot_manifest.json` |
| 2 | **Option 1/2 (OD-01)** | `mapping_contract.csv` path, G1 profile |
| 3 | G2/G3 sign-off | Approved mapping, schema smoke |
| 4 | **Assets defer or restore** | `media_ipl_contract.csv`, manifest update |
| 6 | **G4 VERIFIED** | `dry_run_reconciliation.json`, hash ledger |
| 7–9 | G5 dev load | Load ledgers + `dev_reconciliation_report.json` |
| 10 | G6 staging | `staging_reconciliation_report.json` |
| 11 | Human cutover approval | `cutover_decision_record.md` |
| 12 | G7 prod + G8 sync tests | Prod reconciliation, sync/DLQ artifacts |

---

## Related artifacts

- `discoveries/matrices/agent-workstream-matrix.csv` — agent DAG and stop conditions  
- `agent/orchestration/agent-batch-launch-plan.md` — launch rules and loader order  
- `discoveries/matrices/verification-gates.csv` — G0–G8 pass conditions  
- `discoveries/matrices/assessment-issues-matrix.md` — nine-month failure narrative  
- `discoveries/matrices/agent-role-results.md` — per-agent blocked-state evidence
