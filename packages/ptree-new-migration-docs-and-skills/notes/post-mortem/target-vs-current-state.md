# Target vs current state — PartsTree → Shopware migration

**Generated:** 2026-06-02  
**Scope:** Executive synthesis from `source_profile.json`, dry-run evidence, gate verification, Confluence PDF (REF), and `agent-workstream-matrix.csv` (26 agent roles profiled in `agent-role-results.md` / `.tsv`).

---

## Architecture intent (target)

Confluence and migration strategy describe a **layered Shopware catalog**:

```text
Brand → Brand Family → Model → Model Variant → IPL (diagram) → Parts (products)
```

**Ongoing sync (Phase 7):** DocumentDB change streams → compact metadata (source ID + correlation ID only) → DynamoDB ledger (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED`) → processors reuse baseline normalization/load code → EventBridge for orchestration, not full-document payloads → daily reconciler vs source truth.

**Workflow:** Cataloger ETL uses publication states (`sync`, `review`, `approved`, `deleted`) to drive what reaches Shopware.

**Target platform:** Shopware 6 with custom fields, `PartsTreeIplPlugin`, IPL custom entity + joins (`ipl`, `ipl_model`, `ipl_product`), Admin API bulk via `/api/_action/sync`, external CDN URLs on custom fields (not a parallel CDN-only product surface).

---

## What sample data + workspace prove today (current)

| Dimension | Target | Current (measured / workspace) |
|-----------|--------|--------------------------------|
| **Source shape** | Collections for products, inventory, assets, attributes; live DocumentDB freeze | Single **`products`** collection (`part` 4.76M, `model` 383K) + **`inventory`**; **no `assets.bson`**, **no `attributes.bson`** in sample zip |
| **Hierarchy** | Distinct brand/model/IPL entities | Brands as **`marketing_brand` / `manufacturing_brand` arrays** on products; **355,939** products with `ipl` field but **no assets** to join |
| **Workflow flags** | Top-level sync/review/approved/deleted in ETL contract | BSON uses **`meta.approved`**, **`meta.deleted`**, **`meta.review`**; top-level `sync` not observed on samples |
| **Scale** | Full catalog load + sync | **5,142,183** products, **3,626,867** inventory rows profiled from sample |
| **Publication** | Frozen Shopware `active`/visibility rules | **438,979** `meta.deleted=true` products; **26,545** unapproved — **OD-06 open** |
| **Stock/price** | `products.stock` → `inventory.source` join with fallback policy | **973,287** empty `stock`; **2,735,879** inventory missing `quantity_on_hand`; **3,670** price parse failures — **OD-04/05/08 open** |
| **Media/IPL load** | Media entities + IPL plugin associations | Dry-run **0 loadable** for media and IPL groups (`assets` missing) |
| **Shopware target** | Schema snapshot, custom fields, plugin smoke per env | **0/4** G3 artifacts; **no OAuth**; `environment_matrix.csv` empty |
| **Gates** | G0–G4 before Batch D | **G1 PASS**, **G4 PASS** (summary-only); **G0, G2, G3 FAIL**; G5–G8 absent |
| **Agents** | 26 roles with deliverables | **0 READY**, **2 RISK**, **24 BLOCKED** (see `agent-role-results.tsv`) |

---

## Catalog & workflow gap (depth)

### Single `products` collection vs layered target

- **Intent:** Navigate and load Brand → Model → IPL → Part as separate Shopware constructs (categories and/or custom entities).
- **Current:** All sellable rows live in one MongoDB collection distinguished by `type=part|model`. Dry-run splits **4.76M parts** (4.44M loadable after gates) and **383K models** (**141,758 blocked** pending **OD-01** category vs custom entity).
- **Failure mode:** Category/Model Loader would hit unresolved hierarchy mapping and indexing volume (~241K loadable models + IPL categories) without Shopware smoke or batch sizing.

### Workflow: `meta.*` vs documented cataloger flags

- **Intent:** Explicit sync/review/approved/deleted driving ETL.
- **Current:** Flags under **`meta.*`**; risk of silent mis-load if mapping contract assumes top-level fields (**OD-17**).
- **Failure mode:** Normalization could load deleted/unapproved rows or skip valid rows if transform path is wrong — **439K deleted**, **26K unapproved** not contractually mapped to Shopware semantics.

### Volume & data quality at scale

| Metric | Count | Migration impact |
|--------|------:|------------------|
| Parts (type=part) | 4,759,440 | Product Loader; sync API throughput unknown |
| Models (type=model) | 382,743 | 141,758 blocked until OD-01 |
| Empty `products.stock` | 973,287 | Inventory join failures without OD-04 |
| Missing `quantity_on_hand` | 2,735,879 | Inventory Loader blocked without OD-05 |
| `meta.deleted` products | 438,979 | Publication gating OD-06 |
| Unapproved products | 26,545 | Must not load without policy |
| Empty `photos[]` | 4,622,287 | Media blocked until assets + CDN contract |
| `ipl` field present | 355,939 | IPL Loader **0 loadable** without assets.bson |
| Price parse failures | 3,670 | DQ + mapping validation OD-08 |

---

## Media / IPL gap

- **Target:** `assets` collection + CDN URLs → Shopware media + IPL custom entity joins.
- **Current:** **`assets.bson` absent**; 81 `assets_staging_incremental_*` metadata stubs only; dry-run groups **`media_assets_to_shopware_media`** and **`ipls_to_custom_entity`** have **candidate_count=0**, **loadable_count=0**.
- **Failure mode:** Media/IPL Contract and Loader agents cannot run; G4 correctly notes `media/IPL blocked=true` but is not a substitute for contracts or payloads.

---

## Shopware & access gap

- **Target:** Per-env Admin API, custom field parity (OD-11), IPL plugin verified, sync batch limits documented.
- **Current:** **TB-01/TB-02/TB-03** — empty environment matrix, no OAuth, no `shopware_schema_snapshot.json` / `api_smoke_results.json`.
- **Failure mode:** Every Batch D–E loader and Target Schema Contract agent blocked; independent reconciliation cannot read target state.

---

## Ongoing sync gap (Batch F)

- **Target:** Change streams on `products`, `inventory`, `assets` → compact events → DynamoDB ledger → idempotent processors (same code as baseline).
- **Current:** **G8 FAIL** (0/2 artifacts); **OD-14** open; EventBridge/Lambda/DynamoDB ARNs unknown; DocumentDB live access **deferred**; legacy pipelines may use **`$facet`** / correlated **`$lookup`** unsupported on DocumentDB 5.0.
- **Failure mode:** Sync Processor would see duplicate events (at-least-once), 3h default change-stream retention lag, and 16 MB event ceiling if full documents were emitted.

---

## Gate verification delta (2026-06-02 re-run)

Command: `node agent/scripts/verify-gates.mjs` from `/Users/jeremyalston/Downloads/AltusNova`.

| Result | Gates |
|--------|-------|
| **No change** vs prior run | **5/12 passed** — G1, G4, SETUP, REF ×2 |
| Still failing | G0, G2, G3, G5, G6, G7, G8 |
| Notable G4 detail | `dry-run groups=5; media/IPL blocked=true` (presence check, not payload/hash proof) |

`gate_verdicts.tsv` timestamp updated on re-run; pass/fail labels unchanged.

---

## Top 10 cross-role issues (target vs current)

1. **`assets.bson` missing** — 0 loadable media/IPL; 355K `ipl` fields unjoinable (A Snapshot, B Media/IPL, D Media/IPL Loader).
2. **Shopware OAuth + empty `environment_matrix.csv`** — blocks G0, G3, all loaders (A Access/Infra, A Target Shopware, D–E).
3. **OD-01 unresolved** — 141,758 model rows blocked; category vs custom entity (B Mapping, D Category/Model Loader).
4. **G2 mapping not approved** — starter only; publication/stock/media rows open (B Mapping, C Normalization).
5. **G3 0/4 Shopware contract artifacts** — custom fields and IPL plugin unproven (A Target Shopware, B Target Schema).
6. **Publication gating unfrozen (OD-06)** — 439K deleted + 26K unapproved (B Mapping, C Normalization, D Product Loader).
7. **Stock join contracts unfrozen (OD-04/05)** — 973K empty stock + 2.74M missing qty_on_hand (B Mapping, D Inventory Loader).
8. **Sample ≠ production freeze (OD-16)** — G1 pass on sample BSON risks false prod confidence (A Snapshot, B Source Profile, E Prod).
9. **G4 superficial vs true verification** — no `normalized_payloads/`, hash ledger, or `dry_run_reconciliation.json` (C Normalization, C Independent Verification).
10. **Batch F infra + compact event contract absent** — G8 FAIL; DocumentDB change streams, DynamoDB ledger, EventBridge ARNs unknown (F all roles).

---

## Recommended sequencing (orchestrator)

1. **Human:** H-01/H-02 Shopware OAuth + environment matrix; H-04 assets export or signed deferral; assign owners on `open_decisions.tsv`.
2. **Domain:** Close OD-01, OD-04, OD-05, OD-06, OD-11, OD-16 (minimum blocker set).
3. **Batch A completion:** Target Shopware schema/smoke; Source Snapshot assets checksum or deferral.
4. **Batch B:** `mapping_contract.csv`, G3 artifacts, `source_join_report.csv`, media/IPL contract (or explicit defer).
5. **Batch C:** Real payloads + hash ledger + `dry_run_reconciliation.json`; tighten G4 check in `verify-gates.mjs`.
6. **Do not launch Batch D loaders** until Batch C `VERIFIED` and G0–G4 true pass conditions met.
7. **Batch F paper design** (E-08) may proceed in parallel; implementation blocked on baseline G5–G7 and AWS discovery.

---

## Related artifacts

| File | Purpose |
|------|---------|
| `agent-role-results.md` | Per-role narrative append log |
| `agent-role-results.tsv` | Machine-readable 26-row profile |
| `blockers_master.md` | Unified P0/P1 register |
| `gate_verdicts.tsv` | Automated gate snapshot |

**Roles profiled:** 26 · **Subagents used:** 6 (one per batch A–F) · **Verdicts:** 24 BLOCKED, 2 RISK, 0 READY
