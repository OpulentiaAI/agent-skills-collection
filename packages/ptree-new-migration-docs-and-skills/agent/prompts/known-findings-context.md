# Known baseline findings (demo context)

**Use with:** [demo-client-brief.md](./demo-client-brief.md), [RECREATE-ANALYSIS-AGENT-PROMPT.md](./RECREATE-ANALYSIS-AGENT-PROMPT.md), and PTREE skills under `agent/skills/`.

**Glossary (Part 1):** [`notes/glossary-and-findings.md`](../../notes/glossary-and-findings.md) — define jargon on first use in sponsor prose (e.g. **IPL (Illustrated Parts List)**, **compact EventBridge event**).

## Agent instructions

These findings are **expected demo context**, not secrets. Re-validate every measured value against `client-data/extracts/source_profile.json` (and `discoveries/assessment/output/transform_stats.json` where cited) in this session; note drift if counts change. Headline labels use **blocker themes** below; map discovery IDs (`DISC-*`) only in appendix tables, not executive headlines. Explain delays as **sequencing and contract failures** (loaders before mapping freeze, missing exports, unsigned publication policy) — not individual blame. For each material blocker, write **natural-language prose** (not bullets-only): what the program likely did wrong, how that drove calendar slip (nine-month rework vs a gated three-month replay), and what week 1–4 of gated replay would have prevented. Record those blocks in `discoveries/demo-session-findings.md` under `## Delay and misstep narrative`.

---

## Part 2 — Major findings → key blockers

Measured values from `source_profile.json` and `transform_stats.json` unless noted. Blocker themes align with discovery matrix rows; DISC IDs are appendix vocabulary only.

| Finding (measured or documented) | Why it matters | Key blocker theme | Client action |
|----------------------------------|----------------|-------------------|---------------|
| **5,142,183** product documents (**4.76M** parts, **383K** models) in sample | Confirms Confluence scale (~4.4M parts) but one polymorphic collection, not layered hierarchy BSON | **Collapsed hierarchy** (DISC-007) | Week 1: agree derived hierarchy rules from embedded brand/family signals; do not assume separate brand/IPL collections in export |
| **`hierarchy_collections_present=false`**; **93.0%** empty `equipment_type` | Store navigation (Brand→Family→Model→IPL→Parts) cannot mirror Confluence from BSON alone | **Collapsed hierarchy** (DISC-007) | Commission mapping contract for inferred tree; budget hierarchy rework if Confluence strict parity required |
| **Model mapping undecided** — **92.3%** sample models blocked; **~141,758** est. full corpus | Blocks category tree, IPL associations, and model loaders | **Model mapping decision** (DISC-003) | Domain owner signs Option 1 (categories) or Option 2 (custom entity) by week 2 |
| **`assets.bson` missing**; **355,939** products with `ipl[]` refs | IPL plugin and diagram loads cannot be verified; refs are not loadable entities without assets | **Missing assets export** (DISC-001, DISC-013) | Deliver full `assets.bson` or signed deferral in snapshot manifest before media/IPL batch |
| **`CDN_BASE` null**; **20.65%** part sample `blocked_no_media` | Sellable parts with `photos[]` cannot resolve URLs; policy blocks load without media | **Missing assets export / CDN contract** (DISC-011) | Provide `CDN_BASE_URL` + assets export; Media/IPL contract week 4 hard stop |
| **89.9%** empty `photos[]`**; ~520K non-empty photo refs | Media gap is not “no photos” only — joins still need assets BSON | **Missing assets export** (DISC-001) | Same as assets deliverable; do not start production media loader on stubs alone |
| **438,979** soft-deleted products (**8.5%**) still in dump | Risk of salable deleted SKUs if event path bypasses CRON skip rules | **Publication & workflow mapping** (DISC-004) | Sign publication policy (skip vs inactive) for deleted and **26,545** unapproved rows |
| **`meta.*` vs Confluence `sync`/`review`/`approved`/`deleted`** | ETL and EventBridge must share one semantic map | **Publication & workflow mapping** (DISC-004) | Approve explicit `meta.*` → Shopware visibility map for baseline and sync |
| **`attributes.bson` missing** | Attribute-heavy custom fields unprofiled | **Missing attributes export** (DISC-014) | Confirm scope: deliver attributes BSON or descope fields with sign-off |
| **973,287** parts (**20.4%**) with empty `stock` | Fails Confluence “&lt;1% empty stock” intent; price/qty cannot resolve | **Stock & inventory contract** (DISC-005, DISC-015) | Decide OD-04/OD-05: fallback qty, NLA semantics, and whether zero fallback is allowed in prod |
| **75.4%** inventory rows missing `quantity_on_hand`; **70.9% NLA** | Shopware stock cannot mirror source without qty/NLA rules | **Stock & inventory contract** (DISC-006) | Map NLA/ava/obs to Shopware stock and custom fields; do not treat NLA as qty=0 by default |
| **3,670** unparseable inventory prices; **56** sample price-parse blocks | Pricing errors at scale if parser rules unchanged | **Data quality — pricing** (DISC-012, partial) | Publish price normalization rules and exception queue |
| **81.1%** stock ref join_ok (incl. models); **15** orphan stock refs | Join health looks “good” until empty-stock parts excluded — **INT-007** still GAP | **Stock & inventory contract** (DISC-005, DISC-017) | Fix empty-stock policy before trusting join_ok headline metric |
| **71.6%** transform sample success; **28.37%** error rate | Prior program advanced loaders while ~1/3 sample rows failed contracts | **Transform verification** (DISC-008, DISC-009) | No Batch D until G4 reconciliation + hash ledger verified on target read-back |
| **`profile_verdict=MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE`** | Cutover and change-stream behavior unproven on live DocumentDB | **Production source boundary** (DISC-002) | Week 0: OD-16 go/no-go — production freeze date, live access, and reconciler plan |
| **5.14M** products — full-document EventBridge risk | Ongoing sync can exceed bus/size limits at scale | **Compact ongoing sync design** (DISC-010) | Implement ID-only compact events + ledger before scaling sync; paper design week 10+ per recovery plan |
| **Part count PASS** (4.76M &gt; 4.4M plan) | Scale planning OK; **not** load readiness | *(none — informational)* | Treat PASS as cardinality only; pair with blockers above for go-live |

**Finding count:** **16** rows (15 actionable blockers + 1 informational scale confirmation).

---

## Part 3 — Executive summary (demo sponsor)

The Confluence target for PartsTree is clear and commercially coherent: a six-level equipment hierarchy in Shopware 6, IPL diagrams via a dedicated plugin, CDN-backed media, cataloger-approved publication, and compact AWS sync from DocumentDB at roughly five million products. The June 2026 measured sample confirms **part-scale volume** (4.76M parts) but not readiness to load: the archive is a **sample, not a production freeze**, ships **without `assets.bson` or `attributes.bson`**, and stores brands and IPL refs inside a **single products collection** rather than the layered collections the target narrative assumes. Three decisions and deliverables dominate delay risk: **where models live in Shopware** (still undecided, blocking ~92% of model transforms in sample), **how deleted and unapproved rows publish** (439K deleted, 26K unapproved), and **restoring the assets/CDN path** for media and 356K IPL references. Stock and inventory contracts remain open—one in five parts lacks a stock key, three in four inventory rows lack quantity on hand, and dry-run “success” partly reflects **fallback policies**, not storefront parity (**71.6%** sample success with **28.4%** blocked/skipped). A gated twelve-week replay (profile week 1, mapping decisions week 2, assets week 4, verified dry-run weeks 5–6, then loaders) surfaces these items before Batch D; **16 of 17** measured discoveries were preventable in the first month of that sequence. Sponsors should treat verification and client deliverables as **stop conditions**, not parallel paperwork, if the program is to reach Confluence parity without repeating nine months of rework.
