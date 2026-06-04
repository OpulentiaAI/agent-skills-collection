# 6. Issue Catalog and Root Causes

This section synthesizes the client-facing assessment matrix (28 rows, `CLI-001`–`CLI-028`) and the consulting post-mortem register (40 rows, `IM-001`–`IM-040`) into a single narrative of what went wrong, why it persisted, and how each class of problem stretched a three-month Confluence plan into roughly nine months of delivery. The blocker strategy report and the 2026-06-02 transform dry-run (11,000 rows: 10,000 parts + 1,000 models) provide the quantitative spine: **71.6%** Shopware payload success, **28.4%** error or skip rate, and **zero** locally loadable media or IPL rows because `assets.bson` was absent from the supplied archive.

The matrices are not duplicate inventories. The client matrix measures **schema and data gaps against the written target** (Confluence hierarchy, Shopware plugins, dry-run blockers). The assessment matrix measures **process and governance failures** (late profiling, unfrozen open decisions, gate self-certification, parallel agents blocked). Together they explain why the same technical facts—5.14M products in one collection, 382K models, missing assets—produced months of rework instead of a bounded ETL window.

---

## 6.1 Catalog hierarchy and entity shape

**What happened.** Architecture and mapping work assumed a Confluence-shaped world: distinct Brand → Model → IPL → Part layers with first-class Brand Family and equipment-type landing pages. The BSON profile told a different story. `products.bson` holds **5,142,183** documents with only `type=part|model`—no separate brand or IPL collections (`CLI-001`, `IM-001`). Brand Family and navigation depth had to be **inferred** from sparse metadata (`CLI-004`), while **4,784,435** rows carry empty `equipment_type`, making equipment-type category pages unreliable (`CLI-005`, `IM-031`). The overview document’s hierarchy and the polymorphic `products.type` discriminator diverged, so Store API associations could not be taken for granted (`CLI-007`, `CLI-008`, `IM-016`).

**Root cause.** Profiling and a frozen **G1 source contract** did not precede architecture sign-off. Teams designed Shopware loaders against Confluence diagrams before measuring how the catalog actually stores relationships.

**Timeline impact.** Estimated rework in the client matrix alone stacks to **weeks 33+** across hierarchy rows (D1 diagram family). Consulting attribution (`IM-001`, `IM-016`) adds **~5 months** of delay in the architecture/scope categories because category and model loaders were specified against a layered target the source does not natively expose.

---

## 6.2 Model mapping: Option 1 vs Option 2 (OD-01)

**What happened.** Confluence left **Models→IPLs** undecided: Option 1 (models as categories) vs Option 2 (custom entities and join tables). BSON carries **355,939** models with an `ipl[]` field but no decided Shopware projection (`CLI-003`, `CLI-006`). The dry-run made the cost visible: **923 of 1,000** sample models were blocked for mapping (`CLI-028`, `IM-037`)—**92.3%** of non-deleted models in the sample. Catalog-wide, **141,758** models remain blocked under open decision **OD-01** (`IM-004`). Model volume itself exceeded plan assumptions (**382,743** models vs ~300K in commerce planning, `CLI-002`).

**Root cause.** A human domain decision that should have closed in **week 2** stayed open through implementation. Transforms and Lambdas churned while every model load path remained a stub.

**Timeline impact.** `CLI-006` and `CLI-028` each carry **6 weeks** estimated rework; `IM-004` is scored at **4 months** actual delay. This single unresolved fork blocked the entire model/IPL workstream and inflated the dry-run **blocked_model_mapping** rate to **8.4%** of all input rows—disproportionate to row count because models gate IPL and navigation trees.

---

## 6.3 Media, assets, and IPL execution

**What happened.** The supplied archive had **no `assets.bson`**—only **81** staging metadata stubs (`CLI-009`, `IM-002`). Roughly **520K** products reference non-empty `photos[]`, yet **89.9%** of products have no photos (`CLI-010`, `CLI-011`, `IM-015`). Without an assets join and `CDN_BASE`, the transform blocked **2,065 of 10,000** sample parts (**20.65%**, `CLI-012`, `IM-038`). IPL custom entity work depends on diagram assets and hotspot coordinates; with no assets join in sample data, IPL loading cannot be verified (`CLI-013`, `IM-003`). A concrete example—part `ARIPS22PRT` / `3035744` with **8** photo refs and no assets row—shows the broken ID → URL → Shopware media chain (`CLI-014`). Blocker strategy dry-run summary: **0** loadable media rows, **0** IPL rows locally.

**Root cause.** Media/IPL scope was designed before a signed export or deferral (`H-04` class escalation). CDN base URL remained unknown (`IM-034`).

**Timeline impact.** Client matrix assigns **8–10 weeks** per critical IPL/media row (`CLI-003`, `CLI-009`, `CLI-013`); `IM-002` and `IM-038` add **2–3 months** in the data category. IPL and storefront conversion work sat idle while part transforms pretended media could be “fixed later.”

---

## 6.4 Inventory, stock, and price integrity

**What happened.** Stock is not a simple scalar on the part document. **973,287** parts have empty `stock` (**20.4%**), breaking naive `products.stock → inventory` joins (`CLI-020`, `IM-012`). In `inventory`, **2,735,879** rows (**75.4%**) lack `quantity_on_hand` (`CLI-021`, `IM-013`, open **OD-05**). Availability mixes **NLA**, **AVA**, and related enums—**2,571,968** NLA rows—where “not available” is not the same as quantity zero in UX (`CLI-022`, `IM-033`). The dry-run used fallbacks: **1,054** rows (**9.6%**) got default stock, masking salability (`CLI-024`, `IM-040`). **3,670** prices failed parse (`CLI-025`, `IM-014`). Fifteen orphan stock refs are small but signal join integrity gaps (`CLI-023`, `IM-028`).

**Root cause.** Inventory normalization and loader agents started before **OD-04** (empty stock join) and **OD-05** (missing qty fallback) were contractually signed. Hard-coded null coalescing in transforms substituted zeros without a published policy.

**Timeline impact.** **~4 weeks** per high-severity inventory row in the client matrix; **3+ months** combined in assessment data rows (`IM-012`, `IM-013`, `IM-040`). Months **4–7** rework loops on stock joins are called out explicitly in the assessment narrative.

---

## 6.5 Workflow flags and publication semantics

**What happened.** Confluence describes cataloger workflow: **sync**, **review**, **approved**, **deleted**, with CRON ETL gating before website API. BSON encodes much of this under `meta.*`, with **438,979** products marked deleted (**8.5%**, `CLI-016`, `IM-010`) and **26,545** unapproved or missing approval (`CLI-017`, `IM-011`). Continuous EventBridge processing needs the same gates (`CLI-015`, `CLI-019`, `IM-009`). The dry-run skipped **77** deleted rows in the sample (`CLI-018`, `IM-039`)—a low sample rate that still implies hundreds of thousands of catalog-wide decisions once publication policy **OD-06** stays open.

**Root cause.** Workflow alignment was treated as a mapping detail rather than a **publication contract** frozen before normalization. `meta.*` paths were not documented in an approved `mapping_contract.csv` (`IM-009`, `IM-017`).

**Timeline impact.** **2–3 weeks** per client row; **~2 months** each for `IM-010` and `IM-011`. Unfrozen deletion semantics distort counts, reconciliation, and storefront “inactive vs absent” behavior—forcing re-runs when policy finally lands.

---

## 6.6 Scale, sync, and eventing architecture

**What happened.** The catalog operates at **5M+** product scale with ongoing DocumentDB change streams. Confluence’s EventBridge design assumes **compact, ID-only events** and fetch-on-process (`CLI-026`, `IM-024`). Full-document payloads risk **16 MB** DocumentDB limits and **256 KB** EventBridge limits (`IM-024`). Change stream consumers must strip documents before `PutEvents` (`CLI-027`, `IM-027`). Infra reality lagged: bus/rules/ARNs unknown (`IM-022`), streams not enabled with short retention (`IM-023`), DynamoDB event ledger not provisioned (`IM-026`), legacy cataloger aggregation patterns incompatible with DocumentDB 5.0 (`IM-025`). The three-month plan under-scoped ongoing sync; Batch F work started late (`IM-005`).

**Root cause.** Ongoing sync was scoped as a late-phase add-on rather than a week-1 paper contract with quota math and idempotent ledgers. Implementation preceded **G8** infra artifacts.

**Timeline impact.** **4–5 weeks** per client sync row; **2 months** each for several infra/architecture IM rows. Sync cannot safely go live without duplicate/replay tests—so production cutover slips even when batch loaders exist.

---

## 6.7 Governance, gates, and parallel workstreams

**What happened.** The control plane that should have sequenced work failed in predictable ways. **G2** never passed with an approved mapping contract—only an 11-row starter CSV (`IM-017`). **G3** scored **0/4**: no OAuth, no `shopware_schema_snapshot.json`, no API smoke (`IM-006`, `IM-007`). **G4** passed on summary JSON without `normalized_payloads/` or `payload_hash_ledger.sqlite` (`IM-018`, `IM-021`). **24 of 26** agent roles were **BLOCKED**, yet parallel workstreams still started (`IM-019`, `IM-032`). **15 of 17** open decisions lacked owners (`IM-020`). Sample BSON passed **G1** while **OD-16** (sample ≠ production freeze) was not enforced (`IM-027`).

**Root cause.** Self-certified gates and loader agents (Batch D+) running before **G0–G4** verification—the explicit non-negotiable in project `AGENTS.md`. Verification tooling did not require hash ledgers or reconciliation JSON (`IM-018`, `IM-036`).

**Timeline impact.** Process category rows sum to **~18 months** of attributed delay in the matrix (overlapping, not purely additive). Months **4–7** with Shopware never receiving OAuth smoke is the critical path: no independent reconciliation, no loader proof.

---

## 6.8 Tooling, vendor target, and operational readiness

**What happened.** Shopware side remained a black box for most of the program: **PartsTreeIplPlugin** never externally smoke-tested (`IM-008`), custom field dev/staging/prod parity unverified (`IM-030`), sync API batch sizing unknown for **~4.4M** loadable parts (`IM-035`, `CLI-026` scale context). Tooling produced trustworthy **schemas**—`validate_schema.mjs` passed **50/50** normalized products and **20/20** Shopware write examples—but examples are not production load proof. Environment matrix gaps (CDN, EventBridge, secrets) blocked media and sync contracts (`IM-034`, `IM-022`).

**Root cause.** Target verification was treated as a vendor chore deferred to month 6+ instead of Batch A deliverables. Strong local schema work masked absent remote contract proof.

**Timeline impact.** Vendor category **~8 months** attributed; plugin and custom-field unknowns force rework when staging finally exposes drift. Schema validation “green” gave false confidence while **G3** stayed red.

---

## 6.9 Cross-cutting pattern: discovery after design

Across themes, the same pattern repeats: **design and build first, measure and freeze second**. The client matrix quantifies **gap_severity** and **estimated_rework_weeks** per technical row; the assessment matrix quantifies **actual_delay_months** and **preventable=Y** for nearly every IM row. The blocker strategy report’s loadability table is the executive summary—**4.44M** parts theoretically loadable, **323K** blocked; **241K** models loadable if OD-01 resolves, **142K** blocked; **zero** media/IPL locally—while the dry-run’s **28.4%** failure rate on a mere **11K** row sample shows normalization was still unsafe at small scale.

| Theme | Representative IDs | Primary root cause | Timeline signal |
|-------|-------------------|--------------------|-----------------|
| Hierarchy / entity shape | CLI-001, CLI-007, IM-001, IM-016 | Architecture before BSON profile | Weeks 33+ (client est.); ~5 mo (IM) |
| Models Option 1/2 | CLI-006, CLI-028, IM-004, IM-037 | OD-01 never closed | 6 wk/row; 4 mo (IM-004) |
| Media / IPL | CLI-009–CLI-013, IM-002, IM-038 | Missing assets.bson + CDN | 0 loadable; 2–3 mo (IM) |
| Inventory / stock | CLI-020–CLI-024, IM-012, IM-040 | OD-04/OD-05 open | Months 4–7 rework |
| Workflow flags | CLI-015–CLI-019, IM-010, IM-039 | Publication policy unfrozen | Hundreds of K rows affected |
| Scale / sync | CLI-026, CLI-027, IM-022–IM-026 | Batch F late; compact contract | G8 fail; sync blocked |
| Governance | IM-017–IM-019, IM-032 | Gates passed without evidence | G3 0/4; 24/26 agents blocked |
| Tooling / vendor | IM-006–IM-008, IM-034 | No Shopware smoke | Vendor ~8 mo attributed |

---

## 6.10 Preventable fixes (catalog-level)

The assessment matrix marks **preventable=Y** for all forty rows. The highest-leverage corrections, echoed in the blocker strategy report, are procedural rather than heroic engineering: profile BSON before architecture sign-off (`IM-001`); human-close **OD-01** in week 2 (`IM-004`); obtain **assets.bson** or signed deferral before media/IPL design (`IM-002`); freeze `mapping_contract.csv` with zero blocker rows before Batch C (`IM-017`); require Shopware schema smoke and hash ledgers before loaders (`IM-007`, `IM-018`); adopt compact EventBridge contracts and provision ledgers before sync (`IM-024`, `IM-026`); enforce `verify-gates.mjs` in CI so Batch D cannot start on red gates (`IM-032`).

Until those controls operate as gates—not slide decks—the issue catalog will continue to grow faster than transforms can clear it. Section 6’s catalogs are the evidence base for that claim: **68** tracked issues, one dry-run, and nine months of calendar time pointing at the same root causes.
