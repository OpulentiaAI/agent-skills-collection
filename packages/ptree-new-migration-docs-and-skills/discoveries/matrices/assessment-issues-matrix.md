# PTREE migration assessment — issues matrix (9-month post-mortem)

**Generated:** 2026-06-02  
**Scope:** Consulting delivery slip (3-month Confluence plan → 9-month actual)  
**Evidence:** `source_profile.json`, transform dry-run (`discoveries/assessment/output/`), gate verdicts, blockers register

---

## Why 9 months vs 3 months

The Confluence plan assumed a **known source shape**, **frozen Shopware mapping**, and **parallel loader/sync workstreams** starting early. Reality inverted the sequence:

1. **Weeks 1–4 (plan):** Architecture and Shopware target design proceeded on Confluence hierarchy (Brand→Model→IPL→Parts) without a measured BSON profile or assets export.
2. **Months 2–4:** Implementation churn on transforms and Lambdas while **OD-01** (141K models), **assets.bson** absence, and **meta.\*** workflow mismatch remained open.
3. **Months 4–7:** Shopware environments never received OAuth/schema smoke (G3 0/4); loaders could not be verified; G4 passed on summary JSON only.
4. **Months 7–9:** Rework loops on stock joins (973K empty stock, 2.74M missing qty), publication gating (439K deleted), media/IPL (0 loadable), and EventBridge design without compact contract.

**Consulting failure modes:** late profiling, parallel workstreams blocked by unfrozen contracts, self-certified gates, sample≠prod boundary ignored, and Batch F infra scoped before Batch C proof.

---

## Matrix summary by category

| Category | Rows | Total delay (months, est.) |
|----------|-----:|---------------------------:|
| scope | 5 | 14 |
| architecture | 8 | 22 |
| data | 12 | 28 |
| process | 6 | 18 |
| vendor | 4 | 8 |
| infra | 5 | 12 |

---

## Top findings (from transform dry-run + gates)

**Dry-run sample:** 10,000 parts + 1,000 models from real `products.bson` (2026-06-02 run)

| Metric | Count | Rate |
|--------|------:|-----:|
| Input rows | 11,000 | 100% |
| Shopware payload success | 7,879 | 71.6% |
| **Error / skip rate** | 3,121 | **28.4%** |
| Blocked OD-01 (models) | 923 | 8.4% |
| Blocked no media (photos refs, no assets.bson) | 2,065 | 18.8% |
| Skipped deleted | 77 | 0.7% |
| Blocked price parse | 56 | 0.5% |
| Stock fallback used (OD-05 absent qty) | 1,054 | — |

1. **assets.bson missing** — 18.8% of sample parts with photo refs cannot load media (IM-002, IM-038).
2. **OD-01 unresolved** — 92.3% of sample models blocked (923/1000 non-deleted) (IM-004, IM-037).
3. **Shopware access absent** — G3 0/4; no schema smoke (IM-006, IM-007).
4. **G4 superficial pass** — no hash ledger or reconciliation JSON (IM-018).
5. **Publication gating unfrozen** — deleted rows skipped; 439K catalog-wide (IM-010, IM-039).
6. **Stock/qty contracts open** — 1,054 fallbacks in sample; 2.74M missing qty catalog-wide (IM-013, IM-040).
7. **Single products collection vs layered target** — hierarchy inferred not stored (IM-001, IM-016).
8. **Sample ≠ prod freeze** — G1 pass on sample BSON only (IM-027).
9. **Batch F infra absent** — compact event contract now drafted; ARNs unknown (IM-022, IM-024).
10. **24/26 agents BLOCKED** — parallel work without gates (IM-019, IM-032).

See `assessment-issues-matrix.tsv` for full register (40 rows).

---

## Related artifacts

| Artifact | Path |
|----------|------|
| Target-state schemas | `discoveries/assessment/schemas/` |
| EventBridge IaC + simulator | `discoveries/assessment/infrastructure/eventbridge/` |
| Transform outputs | `discoveries/assessment/output/` |
| Target vs current | `discoveries/target-vs-current-state.md` |
