# Blockers master register — PartsTree → Shopware migration

Generated: 2026-06-02. Deduplicated union of `source_data_blockers.md` (SB-*) and `target_system_blockers.md` (TB-*). Status reflects workspace evidence and `gate_verdicts.tsv`.

**Registers:** `source_data_blockers.md` · `target_system_blockers.md` · `open_decisions.tsv` · `target_systems_docs_index.md`

---

## Unified P0 / P1 (deduplicated)

| ID | source\|target | severity | gate | owner agent role | status | next action |
|----|----------------|----------|------|------------------|--------|-------------|
| B-01 | source+target | P0 | G0,G1,G4 | Source Snapshot (A); Media/IPL Contract (B) | open | Obtain full `assets.bson` or approved deferral; unblock media/IPL dry-run groups |
| B-02 | target | P0 | G0,G3,G5+ | Access/Infra (A) | open | Human: Shopware OAuth client + populate `environment_matrix.csv` |
| B-03 | target | P0 | G3 | Target Shopware (A); Target Schema Contract (B) | open | Produce `shopware_schema_snapshot.json`, `custom_field_diff.csv`, `plugin_health_report.md`, `api_smoke_results.json` |
| B-04 | source+target | P0 | G2,G3 | Mapping Contract (B); Human Domain Owner | open | Approve `mapping_contract.csv`; resolve OD-01 model→category vs custom entity |
| B-05 | source+target | P0 | G2,G4 | Mapping Contract (B); Normalization (C) | open | Freeze publication rules for deleted (439K) and unapproved (26K) — OD-06 |
| B-06 | source+target | P0 | G2,G4 | Mapping Contract (B); Inventory Loader (D) | open | Freeze stock fallback for empty `products.stock` (973K) and missing `quantity_on_hand` (2.74M) — OD-04, OD-05 |
| B-07 | source | P0 | G0,G1 | Source Snapshot (A); Source Profile (B) | open | Generate `source_profile.json` + join report from BSON; complete manifest checksums |
| B-08 | source | P0 | G0 | Access/Infra (A); Source Snapshot (A) | deferred | Human: DocumentDB read-only URI or maintain approved sample-only boundary |
| B-09 | target | P0 | G3,G4 | Target Schema Contract (B); Media/IPL Contract (B) | open | Verify IPL plugin + join tables; smoke `/api/search/ipl` when credentials exist |
| B-10 | target | P0 | G3 | Target Schema Contract (B) | open | Custom field dev/staging/prod parity — OD-11 |
| B-11 | source+target | P1 | G2,G4 | Mapping Contract (B); DQ Queue (C) | open | Price validation policy for 3,670 parse failures — OD-08 |
| B-12 | source | P1 | G2 | Mapping Contract (B) | open | `equipment_type` sparse (4.78M empty); do not depend on field for nav |
| B-13 | target | P1 | G3,G5 | Access/Infra (A); Batch Manifest (C) | open | Smoke Shopware sync API batch sizing for 4.4M+ products — `quota_limits.md` |
| B-14 | target | P1 | G8 | Event Contract (F); Sync Processor (F) | open | Compact EventBridge contract + DynamoDB ledger (OD-14); infra ARNs unknown |
| B-15 | source | P1 | G1 | Source Profile (B) | open | Profile `attributes` when full BSON available |
| B-16 | source+target | P1 | G3,B4 | Media/IPL Contract (B) | open | CDN URL contract vs Shopware media paths — OD-03 scope |

**Superseded IDs (do not double-count):** SB-02≈TB-06→B-01; SB-04≈TB-05 partial→B-04; SB-05≈TB-05→B-04; SB-06≈TB-14→B-05; SB-07/08≈TB-15→B-06; TB-01/02→B-02; TB-03→B-03; TB-04→B-10; TB-07≈SB-14→B-09.

---

## Credential / human only

Cannot be cleared by agents without human provisioning or domain sign-off.

| ID | Blocker | gate | owner | next action |
|----|---------|------|-------|-------------|
| H-01 | Shopware Admin OAuth (dev/staging/prod) | G0,G3,G5+ | Human Migration Lead | Create integration client; Secrets Manager |
| H-02 | `environment_matrix.csv` empty (URLs, versions, buckets, CDN) | G0 | Human Migration Lead | Fill matrix; Access/Infra verifies |
| H-03 | DocumentDB live URI / VPC access | G0,G1,G8 | Human Migration Lead | Approve deferral or provide read-only URI |
| H-04 | Full `assets.bson` / IPL export | G0,G1,G4 | Human Migration Lead | Export or sign deferral in manifest |
| H-05 | OD-01 model→category vs custom entity | G2,G3 | Human Domain Owner | Choose Confluence option; unblock 141K models |
| H-06 | OD-02/03 IPL policy and defer-vs-block | G2,G4 | Human Domain Owner | IPL mock/invisible rules + media scope |
| H-07 | OD-06 publication gating (deleted/unapproved) | G2,G4 | Human Domain Owner | Shopware `active`/visibility semantics |
| H-08 | OD-11 custom field parity sign-off | G3 | Human Domain Owner | Approve `custom_field_diff.csv` per env |
| H-09 | OD-15 staging→prod cutover criteria | G7 | Human Migration Lead | `cutover_decision_record.md` |
| H-10 | Batch F AWS infra (EventBridge, Lambda, DynamoDB, IAM) | G8 | Human Migration Lead / AWS admin | Discovery + provision per Confluence |

---

## Engineering can proceed

Work that does not require live credentials or unresolved domain decisions.

| ID | Workstream | owner agent role | next action |
|----|------------|------------------|-------------|
| E-01 | Source profile from sample BSON | Source Profile (B) | Build `source_profile.json`, `source_join_report.csv` from zip |
| E-02 | DQ classification | Data Quality Queue (C) | Extend `quality-issue-counts.csv` samples + ledger schema |
| E-03 | Dry-run payloads (parts/inventory) | Normalization Harness (C) | Generate payloads with media/IPL explicitly `BLOCKED_DEFERRED` |
| E-04 | Mapping draft | Mapping Contract (B) | Expand starter → `mapping_contract.csv` + `mapping_open_questions.tsv` |
| E-05 | Gate / evidence hygiene | Project Evidence (A) | Run `node agent/scripts/verify-gates.mjs`; update `evidence_index.md` |
| E-06 | Target doc index | Project Evidence (A) | Keep `target_systems_docs_index.md` current as vendor links change |
| E-07 | Batch manifest sizing (theoretical) | Batch Manifest (C) | Draft `batch_manifest.csv` from dry-run counts + quota placeholders |
| E-08 | Sync contract design (paper) | Event Contract (F) | Draft `sync_event_contract.json` ID-only schema per strategy Phase 7 |

**Blocked until H-01/H-02:** Shopware API smoke, plugin health, dev load (G5+).

**Blocked until H-04:** Media/IPL loaders and CDN resolution smoke.

---

## Gate snapshot (from `gate_verdicts.tsv`)

| Gate | pass | detail |
|------|------|--------|
| G0 | FAIL | 5/5 artifacts; live access ready=false |
| G1 | PASS | `source_profile.json` present (2026-06-02 BSON profile) |
| G2 | FAIL | starter mapping only |
| G3 | FAIL | 0/4 Shopware contract artifacts |
| G4 | PASS | dry-run groups=5; media/IPL blocked=true |
| G5–G8 | FAIL | loader/sync artifacts absent |
| SETUP | PASS | skills wired |
| REF | PASS | Confluence PDF + sample zip |

Re-run: `node agent/scripts/verify-gates.mjs` from repo root (`AltusNova`).
