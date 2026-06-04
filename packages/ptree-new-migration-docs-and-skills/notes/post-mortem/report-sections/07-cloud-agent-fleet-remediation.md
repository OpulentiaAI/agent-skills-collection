# 7. Cloud Agent Fleet Remediation

The nine-month slip on the PartsTree Catalog DB → Shopware migration was not primarily a capacity problem. It was a **sequencing and verification** problem: architecture and loader work proceeded in parallel while source shape, target schema, mapping decisions, and media/IPL contracts remained unfrozen. Section 06 documented eight recurring failure themes—access and source freeze, unresolved target model, volume/sparsity surprises, data quality as core work, media/IPL source gaps, eventing without idempotency, absent durable replay, and Shopware plugin/custom-field drift—plus process failures where 24 of 26 agent roles were blocked yet parallel workstreams continued anyway.

This section describes how a **gated cloud agent fleet** remediates each theme within a restored **three-month control plane**, using the 26-role workstream matrix (`agent-workstream-matrix.csv`), batch launch plan, and MCP-backed tooling. The fleet does not replace human domain decisions; it **forces evidence before fanout** and **parallelizes only where dependencies permit**.

---

## Fleet design principles

Three rules govern every launch:

1. **Batch gates, not optimism.** Loaders (Batch D+) do not start until G0–G4 are `VERIFIED` or explicitly deferred by the human migration lead (`AGENTS.md` non-negotiable rule).
2. **Independent verification.** Loaders and normalizers do not self-certify. The Independent Verification Agent and Independent Reconciliation Agent compare payload hashes to target reads.
3. **Structured child output.** Every agent returns JSON with `verdict`, `artifacts`, `blockers`, `open_questions`, and `next_batch_ready`—summary-only responses are rejected.

The Lead Orchestrator aggregates batch verdicts, updates `gate_verdicts.tsv` via `verify-gates.mjs`, and launches the next batch only when stop conditions clear.

---

## MCP and tooling layer

Agents are not generic chat sessions. Each role is provisioned with domain-specific MCP tools and repo scripts:

| Tool / capability | Primary consumers | Remediation function |
|-------------------|-------------------|----------------------|
| **DeepWiki subagent** | Target Shopware Agent; Target Schema Contract Agent; Event Contract Agent | Researches Shopware Sync API patterns, custom entity vs custom field tradeoffs, DocumentDB change-stream limits, and compact-event design (`deepwiki-target-ideal.md`). Prevents late discovery of 16 MB change-stream and 256 KB EventBridge payload ceilings. |
| **Shopware API agent** (OAuth + Admin API MCP) | Target Shopware Agent; all Batch D loaders; Staging/Prod Verification Agents | Produces `shopware_schema_snapshot.json`, `api_smoke_results.json`, and live sync batch sizing. Closes G3 0/4 failure (IM-006, IM-007). |
| **BSON profiler** (`source_profile.json` pipeline) | Source Snapshot Agent; Source Profile Agent | Measures row counts, join rates, sparse fields, `meta.*` workflow flags, and `products.stock → inventory.source` join health on real BSON—not Confluence assumptions. |
| **Schema validator** (`validate_schema.mjs`) | Normalization Harness Agent; Event Contract Agent; Independent Verification Agent | Validates normalized products, Shopware write payloads, and `compact-sync-event.schema.json` before artifacts enter gates. |
| **EventBridge simulator** (`simulate_eventbridge.mjs`) | Event Contract Agent; Sync Processor Agent; DLQ/Replay Agent | Exercises routing, DLQ paths, and compact-event fan-out without provisioning full AWS infra first; pairs with `infrastructure/eventbridge/template.yaml`. |

These tools convert section 06's "discovered in month 7" failures into **week 1–4 artifacts**.

---

## Batch A–F mapping to agent roles

The matrix defines 26 specialized roles across six batches. The table below maps batches to purpose and the agent roles that execute them.

| Batch | Phase | Agent roles | Gate output |
|-------|-------|-------------|-------------|
| **A** | Discovery | Access/Infra; Source Snapshot; Target Shopware; Project Evidence | G0 access; source manifest; Shopware readiness known; open decisions owned |
| **B** | Contracts | Source Profile; Mapping Contract; Target Schema Contract; Media/IPL Contract | G1 profile; G2 zero blocker mappings; G3 writable target paths |
| **C** | Dry-run | Normalization Harness; Data Quality Queue; Batch Manifest; Independent Verification | G4 deterministic payloads + `dry_run_reconciliation.json` |
| **D** | Dev load | Manufacturer/Brand; Category/Model; Product; Inventory; Media/IPL Loaders; Independent Reconciliation | Dev baseline verified by hash |
| **E** | Staging/prod | Staging Load; Staging Verification; Prod Load; Prod Verification | G6/G7 human cutover |
| **F** | Ongoing sync | Event Contract; Sync Processor; DLQ/Replay; Daily Reconciliation | G8 idempotent sync + drift detection |

Batch F may begin **paper design** after Batch B contracts pass, but processors must not go live until Batch E reconciliation is `VERIFIED`—preventing IM-005 (Batch F scoped before baseline proof).

---

## Remediation by section 06 issue theme

### Theme 1: Source-of-truth and access unsettled

**Historical impact:** Blank Shopware OAuth, deferred DocumentDB access, sample BSON treated as production freeze (IM-006, IM-027). Loaders designed against unknown environments.

**Agent remediation:**

| Role | Action |
|------|--------|
| **Access/Infra Agent** | Populate `access_matrix.csv`, `environment_matrix.csv`, `secrets_readiness.md`, `quota_limits.md`; smoke Sync API batch limits for 4.4M+ products. |
| **Source Snapshot Agent** | SHA-256 manifest per collection; fail gate if `assets.bson` missing without approved deferral. |
| **Project Evidence Agent** | Assign owners to all blocker-level open decisions in `open_decisions.tsv` (IM-020). |

**Parallelism:** All four Batch A agents launch together—they share no filesystem and depend on nothing upstream.

---

### Theme 2: Target data model undecided (OD-01 and hierarchy)

**Historical impact:** 141,758 models blocked; 92.3% of sample models failed transform (`blocked_model_mapping=923`). Confluence Option 1 vs 2 deferred while Category/Model Loader was designed (IM-004, IM-016, IM-037).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Mapping Contract Agent** | Freeze model→category vs custom-entity decision; zero blocker rows in `mapping_contract.csv`; human sign-off in `mapping_approval_record.md`. |
| **Target Schema Contract Agent** | Prove every approved mapping path is writable via `custom_field_diff.csv` and `plugin_health_report.md`. |
| **Target Shopware Agent** | DeepWiki-informed schema snapshot; IPL plugin `/api/search/ipl` smoke. |
| **Category/Model Loader Agent** | Blocked until mapping contract `VERIFIED`—no hierarchy load without OD-01 resolution. |

DeepWiki research confirms the production recommendation: **categories for brand/model navigation**, **custom entity `ipl`** for diagrams, **join tables** for M:N associations—not JSON blobs on product.

---

### Theme 3: Source volume and sparsity exceeded planning assumptions

**Historical impact:** Single `products` collection (5.14M docs) vs assumed layered collections; 4.78M empty `equipment_type`; 973K empty stock refs (IM-001, IM-031, IM-012).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Source Profile Agent** | Emit `source_profile.json`, `source_join_report.csv`, `source_quality_issues.sqlite` from real records—not starter estimates. |
| **Mapping Contract Agent** | Explicit transforms for inferred brand family, stock join fallbacks (OD-04), and equipment_type absence. |
| **Normalization Harness Agent** | Split by `type=part|model` with terminal row status for every source ID. |
| **Data Quality Queue Agent** | Classify join failures, sparse fields, and orphan stock refs (`quality_issue_counts.csv`). |

---

### Theme 4: Data quality as the core migration problem

**Historical impact:** 438,979 soft-deleted products, 26,545 unapproved, 2.74M missing `quantity_on_hand`, 3,670 unparseable prices, NLA availability semantics open (IM-010 through IM-014, IM-033, IM-039, IM-040).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Mapping Contract Agent** | Freeze publication policy (OD-06): skip vs inactive vs hard exclude for `meta.deleted` and `meta.approved`. |
| **Normalization Harness Agent** | Apply publication gate in mapper; emit `payload_hash` per row. |
| **Data Quality Queue Agent** | Terminal statuses: `READY_TO_LOAD`, `REJECTED_WITH_REASON`, `DEFERRED_WITH_APPROVAL`. |
| **Inventory Loader Agent** | Load only after OD-05 quantity fallback and OD-08 price rejection rules are signed. |

Transform dry-run showed 28.4% error/skip rate on an 11,000-row sample—acceptable only when **every row has a classified terminal state**, not when errors surface during prod load.

---

### Theme 5: Media and IPL blocked by missing source data

**Historical impact:** `assets.bson` absent; 20.7% of sample parts `blocked_no_media`; 355,939 models with `ipl[]` but zero loadable IPL rows (IM-002, IM-003, IM-015, IM-038).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Source Snapshot Agent** | Gate failure until full assets export or signed deferral (H-04). |
| **Media/IPL Contract Agent** | Produce `media_ipl_contract.csv`, `cdn_resolution_report.csv`; block loader if CDN base unknown (IM-034). |
| **Media/IPL Loader Agent** | Hard stop until assets contract and product/model target IDs exist. |
| **Target Schema Contract Agent** | Verify IPL plugin entity and join writeability. |

DeepWiki anti-pattern explicitly rejected: stuffing 355K IPL records into custom fields instead of the custom entity + join model.

---

### Theme 6: Ongoing sync without idempotent event contract

**Historical impact:** Full-record EventBridge payloads would exceed DocumentDB 16 MB and Lambda 6 MB limits; DynamoDB ledger unprovisioned; change streams not enabled (IM-022 through IM-026).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Event Contract Agent** | Draft `sync_event_contract.json` from `compact-sync-event.schema.json` (~12 properties, ID-only). |
| **Sync Processor Agent** | Fetch authoritative state from DocumentDB post-event; upsert via same normalization as baseline. |
| **DLQ/Replay Agent** | `dlq_replay_runbook.md`; replay by `collection:sourceId` source key. |
| **Daily Reconciliation Agent** | Compare source truth vs target; explain drift via issue queue. |

EventBridge simulator validates routing **before** ARNs are known—paper contract in week 1, infra discovery (H-10) parallel to Batch A–C.

---

### Theme 7: Error handling without durable queues and replay

**Historical impact:** CloudWatch-only debugging; G4 passed on summary JSON without hash ledger (IM-018, IM-021).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Normalization Harness Agent** | `payload_hash_ledger.sqlite` with deterministic two-run hash test. |
| **Independent Verification Agent** | Produce `dry_run_reconciliation.json`; reject G4 without ledger artifacts. |
| **Independent Reconciliation Agent** | Per-loader `dev_reconciliation_report.json` comparing target reads to payload hashes. |
| **DLQ/Replay Agent** | Failed events retain source key, payload hash, retry count, replay command. |

---

### Theme 8: Custom fields, plugins, and process gate failures

**Historical impact:** G3 0/4; dev/staging custom-field parity unsigned (IM-007, IM-008, IM-030); loaders started before G0–G4 (IM-019, IM-032); mapping starter CSV (11 rows) substituted for approved contract (IM-017).

**Agent remediation:**

| Role | Action |
|------|--------|
| **Target Shopware Agent** + **Target Schema Contract Agent** | Schema snapshot and per-environment custom field diff before any Batch C payload generation. |
| **Independent Verification Agent** | Tighten gate script to require `normalized_payloads/` directory and hash ledger—not JSON summaries alone. |
| **Lead Orchestrator** | Enforce `depends_on` column in matrix; CI hook on `verify-gates.mjs` before Batch D fanout. |
| **Project Evidence Agent** | Track decision owners; escalate blockers without owners to human migration lead. |

---

## Three-month week-by-week fleet schedule

The schedule below restores the original three-month intent by **front-loading gates** and **parallelizing within batches**, not across them.

### Month 1 — Weeks 1–4: Discovery and contract freeze

| Week | Parallel agent launches | Human / fleet outcomes |
|------|-------------------------|------------------------|
| **1** | Batch A (all four agents) + DeepWiki research task | `access_matrix.csv` draft; BSON manifest; Shopware OAuth request submitted; `evidence_index.md`; OD-01/06/11 decision sessions scheduled |
| **2** | Batch A completion; Source Profile Agent starts | Live or deferred DocumentDB path documented; `source_profile.json` v1 from sample/production BSON; Shopware schema smoke if OAuth ready |
| **3** | Batch B (all four agents) in parallel | `mapping_contract.csv` draft with explicit `meta.*` paths; `media_ipl_contract.csv`; human resolves OD-01 |
| **4** | Batch B verification; Mapping approval | G2 zero blockers; G3 schema snapshot + plugin health; `cdn_resolution_report.csv` or signed media deferral |

**Slip prevention:** Week 1 parallel Batch A replaces months 1–4 of architecture-without-profile. BSON profiler and DeepWiki run while humans provision credentials—not after loader rework.

### Month 2 — Weeks 5–8: Dry-run proof and dev load start

| Week | Parallel agent launches | Human / fleet outcomes |
|------|-------------------------|------------------------|
| **5** | Batch C (Normalization, DQ Queue, Batch Manifest) | Deterministic payloads for parts/models; 28% sample error rate fully classified in quality queue |
| **6** | Independent Verification Agent | `dry_run_reconciliation.json`; G4 `VERIFIED`; `batch_manifest.csv` with dependency order |
| **7** | Batch D layer 1–2: Brand + Category/Model Loaders + Reconciliation | Dev manufacturers and category tree; hash ledger per batch |
| **8** | Batch D layer 3–4: Product + Inventory Loaders + Reconciliation | 4.4M part load plan tuned via Sync API smoke batch sizing; stock/qty per signed OD-04/05 |

**Slip prevention:** Batch C completes before any prod-scale loader tuning—eliminating IM-018 superficial G4 and IM-035 unknown batch sizing.

### Month 3 — Weeks 9–12: Media/IPL, staging, sync foundation

| Week | Parallel agent launches | Human / fleet outcomes |
|------|-------------------------|------------------------|
| **9** | Media/IPL Loader + Reconciliation (if assets contract cleared) | Media associations async from assets; IPL custom entity joins—or explicit deferral with scoped cutover |
| **10** | Batch E: Staging Load + Staging Verification | Same scripts/manifests as dev; `staging_reconciliation_report.json` |
| **11** | Batch F paper + simulator: Event, Sync, DLQ agents | `sync_event_contract.json`; EventBridge sim pass; duplicate-event test JSON |
| **12** | Prod Load + Prod Verification (human cutover approval) | `prod_reconciliation_report.json`; `cutover_decision_record.md`; Batch F processors enabled post-baseline |

**Slip prevention:** Staging repeats dev-proven manifests (no prod improvisation). Batch F implementation trails baseline proof by one month—not nine.

---

## How fleet parallelism prevents the nine-month slip

The prior engagement treated "26 agents" as 26 parallel workstreams. The matrix specifies **four parallel slots in Batch A**, **four in Batch B**, **three in Batch C** (Verification runs after artifacts), **sequential loader layers in Batch D**, and **human-gated Batch E**. Correct parallelism compresses wall-clock time without hiding dependencies:

```text
Week 1:  [A1 Access] [A2 Snapshot] [A3 Shopware] [A4 Evidence]  ← 4-way parallel
Week 3:  [B1 Profile] [B2 Mapping] [B3 Schema] [B4 Media/IPL]   ← 4-way parallel
Week 5:  [C1 Normalize] [C2 DQ] [C3 Manifest] → [C4 Verify]     ← 3 + gate
Week 7+: [D loaders by dependency layer] → [Reconciliation]      ← sequential proof
```

| Failure mode (section 06) | Fleet countermeasure | Time recovered (est.) |
|---------------------------|----------------------|---------------------|
| Mapping ambiguity discovered late | Mapping Contract Agent gate before Batch C | 2–4 months |
| Unknown data shape | Source Profile Agent week 2 | 2–3 months |
| Missing media/IPL source | Source Snapshot + Media/IPL Contract gates | 2–3 months |
| External access gaps | Access/Infra Agent week 1 | 1–2 months |
| Shopware schema drift | Target Shopware + Schema Contract before payloads | 2–3 months |
| Self-certified gates | Independent Verification + Reconciliation | 1–2 months |
| EventBridge as payload bus | Event Contract + simulator; compact schema | 1–2 months |
| Loader start before contracts | Lead Orchestrator `depends_on` enforcement | 3+ months |

Conservative sum of preventable delay overlaps—but the assessment register (`assessment-issues-matrix.tsv`) attributes the majority of slip to **process and architecture themes addressable in weeks 1–8** if the fleet obeys batch gates.

---

## Orchestrator checklist after each batch

The parent agent (or human migration lead) executes this sequence—identical to `agent-batch-launch-plan.md`:

1. Download and inspect every child artifact path listed in the matrix deliverables column.
2. Reject summary-only outputs; require structured JSON verdict schema.
3. Cross-check verdicts against `verification-gates.csv` via `verify-gates.mjs`.
4. Update `gate_verdicts.tsv`.
5. Launch next batch only when required gates are `VERIFIED` or explicitly deferred.

No Batch D loader agent receives a launch prompt until step 5 confirms G0–G4 for its dependency chain.

---

## Summary

Cloud agent fleet remediation does not accelerate migration by asking more agents to "move data faster." It accelerates by **parallelizing discovery and contract work in weeks 1–4**, **serializing loads behind hash-verified dry-runs**, and **equipping each role with MCP tools** (DeepWiki, Shopware API, BSON profiler, schema validator, EventBridge simulator) that produce gate artifacts instead of slide-deck assertions. The 26-role matrix maps cleanly to batches A–F; section 06's eight issue themes each map to specific agents and week-bound actions in the restored three-month plan. Executed with gate discipline, the fleet converts a 9-month rework spiral into a 12-week evidence-driven baseline—with Batch F sync trailing baseline proof, not racing ahead of it.
