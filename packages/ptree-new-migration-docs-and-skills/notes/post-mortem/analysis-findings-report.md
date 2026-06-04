# PartsTree migration — consolidated analysis findings

**Report generated:** 2026-06-04  
**Profile:** `opulent-sample-bson-2026-06-02` · **Profile measured:** 2026-06-04T01:17:16Z  
**Transform sample:** 2026-06-04T01:15:58Z · 11,000 rows (10,000 parts + 1,000 models)  
**Profile verdict:** `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE`

**Governance:** [semantic-layer.md](semantic-layer.md) · Procedure: [analysis-self-service-guide.md](analysis-self-service-guide.md)

---

## Executive summary (metrics-led)

The Opulent sample archive contains **5,142,183** product documents (**4,759,440** parts, **382,743** models) and **3,626,867** inventory rows. Measured data supports **scale planning for parts** (INT-011 PASS) but **not** production cutover, hierarchy navigation, IPL/media loading, or zero-blocker transforms without client deliverables and signed decisions.

| Signal | Metric | Value | Implication |
|--------|--------|-------|-------------|
| Part scale | `part_document_count` | 4,759,440 | Exceeds Confluence ~4.4M planning figure |
| Stock join | `parts_with_empty_stock_rate` | 20.4% (973,287 / 4,759,440) | INT-007 GAP; OD-04/05 required |
| Join health | `product_stock_join_ok_count` | 81.1% (4,168,881 / 5,142,183) | INT-012 PARTIAL vs >99% intent |
| Model mapping | `model_mapping_block_rate_sample` | 92.3% (923 / 1,000) | OD-01 UNDECIDED; ~141,758 est. full corpus |
| Media/IPL | `assets_collection_present` | false | INT-002/INT-003 GAP; 81 metadata stubs only |
| Photos empty | `photos_empty_rate` | 89.9% (4,622,287 / 5,142,183) | CDN/assets path blocked in sample |
| Workflow | `meta_deleted_product_rate` | 8.5% (438,979) | OD-06 publication policy unsigned |
| Inventory qty | `inventory_qty_on_hand_missing_rate` | 75.4% | NLA/null qty semantics need mapping |
| Transform sample | `transform_sample_success_rate` | 71.6% (7,879 / 11,000) | `transform_sample_error_rate` **28.37%** unchanged |
| Intent rollup | PASS / PARTIAL / GAP / INCONCLUSIVE | 1 / 5 / 7 / 2 | See [intent-comparison-report.md](intent-comparison-report.md) |

**Batch readiness:** Segment analysis (Batch B/C) is complete; **Batch D loaders remain gated** on OD-01, OD-06, assets/CDN, production freeze (OD-16), and mapping contract zero-blocker rows.

---

## Data snapshot provenance

| Artifact | Checksum / timestamp |
|----------|----------------------|
| Outer archive `input-sample-data.zip` | `sha256:e31a36c49a7439c9f971e2af6e4de5aee803518d67700dff5aa981620cc4ebf9` |
| Inner `Opulent/catalog.zip` | per [source_snapshot_manifest.json](source_snapshot_manifest.json) |
| `products.bson` | `f183ee27107831230cb8757cd2688b2439ddad19ff05578fc67212d7282c28cd` · 5,142,183 docs |
| `inventory.bson` | `08c8e7c464c38ce55ae7d2740d4cc9061a6e5a1cfa0be901ad657413ea52b3ca` · 3,626,867 docs |
| `assets.bson` | **missing** (manifest `missing_or_incomplete`) |
| `attributes.bson` | **missing** |
| Profile refresh | `python3 agent/scripts/profile_source_bson.py` → [source_profile.json](../../discoveries/profiles/source_profile.json) |
| Transform refresh | `node discoveries/assessment/scripts/run_transform_dry_run.mjs` → [transform_stats.json](../../discoveries/assessment/output/transform_stats.json) |

Manifest: [source_snapshot_manifest.json](source_snapshot_manifest.json) (`snapshot_id: opulent-sample-2026-06-01`).

---

## Per-segment summaries

| Segment | Headline | Detail |
|---------|----------|--------|
| [products_parts](segment-findings/products_parts.md) | 4.76M parts; 20.4% empty stock | 20.65% part-sample media blocks; STOCK_FALLBACK masks gaps |
| [products_models](segment-findings/products_models.md) | 382,743 models; OD-01 blocks 92.3% sample | ~141,758 est. full-corpus blocked; IPL refs at product grain |
| [inventory](segment-findings/inventory.md) | 3.63M rows; 75.4% missing qty | 70.9% NLA; 3,670 unparseable prices |
| [workflow_meta](segment-findings/workflow_meta.md) | 8.5% soft-deleted products | 26,545 unapproved; meta.* vs Confluence sync path |
| [stock_joins](segment-findings/stock_joins.md) | 81.1% join_ok; 15 orphan refs | 1,054 sample rows used STOCK_FALLBACK=zero |
| [media_ipl](segment-findings/media_ipl.md) | No assets.bson | 355,939 `ipl` refs; absence ≠ zero media |
| [brands_on_products](segment-findings/brands_on_products.md) | 93% empty equipment_type | Single polymorphic collection; INT-001 GAP |

---

## Intent comparison (INT-001–015)

| Status | Count | IDs |
|--------|------:|-----|
| PASS | 1 | INT-011 |
| PARTIAL | 5 | INT-004, INT-005, INT-006, INT-010, INT-012 |
| GAP | 7 | INT-001, INT-002, INT-003, INT-007, INT-013, INT-014, INT-015 |
| INCONCLUSIVE | 2 | INT-008, INT-009 |

Full per-intent evidence: [intent-comparison-report.md](intent-comparison-report.md).

---

## Top blockers and delay estimates

From [blocker-delay-matrix.tsv](blocker-delay-matrix.tsv) (17 discoveries). Highest delay-week estimates:

| DISC | Discovery | Weeks (est.) | Week (3mo plan) | Catching role |
|------|-----------|-------------:|----------------:|---------------|
| DISC-003 | OD-01 model mapping undecided | 20 | 2 | Mapping Contract Agent |
| DISC-007 | Hierarchy collapse / equipment_type sparse | 20 | 1 | Source Profile Agent |
| DISC-010 | EventBridge scale / compact events | 12 | 12 | Event Contract Agent |
| DISC-001 | No assets.bson | 4 | 4 | Media/IPL Contract Agent |
| DISC-011 | CDN null + media blocks | 4 | 4 | Media/IPL Contract Agent |
| DISC-008 | Transform 28.37% sample error rate | 6 | 6 | Independent Verification Agent |
| DISC-009 | G4 hash ledger incomplete | 6 | 6 | Independent Verification Agent |

Narrative: [blocker-delay-narrative.md](blocker-delay-narrative.md) · Client-facing gaps: [client-data-gap-profile.md](client-data-gap-profile.md).

**Preventable (Batch A–C):** 16 of 17 rows `preventable=yes`; 1 `partial` (DISC-012 price parse).

---

## Transform dry-run stats (11k sample)

| Field | Value |
|-------|------:|
| `transform.success` | 7,879 |
| `transform.input_rows` | 11,000 |
| `transform_sample_success_rate` | **71.6%** |
| `transform_sample_error_rate` | **28.37%** |
| `blocked_model_mapping` | 923 |
| `blocked_no_media` | 2,065 |
| `blocked_price_parse` | 56 |
| `stock_fallback_used` | 1,054 |
| `skipped_deleted` | 77 |
| Policies | `OD01_DECISION=UNDECIDED`, `STOCK_FALLBACK=zero`, `CDN_BASE=null`, `PUBLICATION_POLICY=skip` |

Policies mask stock and publication gaps in sample success — success rate is **not** full-corpus load readiness.

---

## Analysis run metadata

| Step | Tool / skill | Output |
|------|--------------|--------|
| Profile refresh | `profile_source_bson.py` | `source_profile.json` |
| Transform refresh | `run_transform_dry_run.mjs` | `transform_stats.json` |
| Segments (×7) | `ptree-segment-data-analyst` | `segment-findings/*.md` |
| Intent | `ptree-intent-comparison-analyst` | `intent-comparison-report.md` |
| Blockers | `ptree-blocker-delay-mapper` | `blocker-delay-matrix.tsv`, `blocker-delay-narrative.md` |
| Orchestrator check | `run_self_service_analysis.mjs` | path validation |

## Provenance

Source: semantic-layer · Profile: opulent-sample-bson-2026-06-02 · Skills: ptree-segment-data-analyst, ptree-intent-comparison-analyst, ptree-blocker-delay-mapper · Reviewed: 2026-06-04 full self-service pass
