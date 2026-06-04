# Client assessment issues matrix

**Evidence scope:** Confluence PDF (`Confluence-PTREE-010626-130110.pdf`), BSON sample (`input-sample-data.zip`), `partstree_catalog_shopware_overview.md`. Does **not** reference consulting gate artifacts (G0–G8, `gate_verdicts.tsv`, `blockers_master.md`).

**Pipeline run:** 2026-06-02 — transform dry-run on 10,000 parts + 1,000 models; schema validation via `validate_schema.mjs`.

| issue_id | client_evidence | target_requirement | gap_severity | schema_impact | transform_impact | estimated_rework_weeks | diagram_ref |
|----------|-----------------|-------------------|--------------|---------------|------------------|------------------------|-------------|
| CLI-001 | BSON: products.bson 5,142,183 docs; only type=part\|model | Confluence Catalog Hierarchy: Brand→Model→IPL→Parts | critical | high | high | 8 | D1 |
| CLI-002 | BSON: 382,743 models vs Confluence ~300K Models | Category/custom entity capacity for all models | high | high | medium | 4 | D1 |
| CLI-003 | BSON: 355,939 models with ipl[]; assets.bson absent | IPLs as Categories + IPL Custom Entity Plugin | critical | high | high | 10 | D2 |
| CLI-004 | Overview.md: Brand Family inferred not first-class | Brand Family category for SEO/navigation | high | medium | high | 6 | D1 |
| CLI-005 | BSON: 4,784,435 empty equipment_type | Brand Equipment Type Page categories | medium | medium | medium | 4 | D1 |
| CLI-006 | Confluence Option 1 vs 2 undecided | Model→IPL mapping blocks all model loads | critical | high | high | 6 | D1 |
| CLI-007 | BSON: single collection part+model | Shopware categories vs products split | high | high | high | 6 | D1 |
| CLI-008 | Overview hierarchy vs BSON type discriminator | Explicit Store API entity graph | high | high | high | 5 | D1 |
| CLI-009 | assets.bson missing; 81 staging metadata stubs | Confluence media/CDN + IPL assets | critical | high | high | 8 | D2 |
| CLI-010 | ~520K products with non-empty photos[] | Admin API media per part | critical | high | high | 6 | D2 |
| CLI-011 | BSON: 4,622,287 photos_empty (89.9%) | Optional images; conversion impact | medium | low | low | 2 | D2 |
| CLI-012 | Transform: blocked_no_media=2065/10000 (20.65%) | assets join + CDN_BASE required | high | high | medium | 4 | D2 |
| CLI-013 | IPL plugin; no assets join in sample | IPL diagram + part hotspots | critical | high | high | 10 | D2 |
| CLI-014 | Sample ARIPS22PRT 3035744: 8 photo refs | Asset ID → URL → media entity | high | high | medium | 3 | D2 |
| CLI-015 | Confluence sync/review/approved/deleted | BSON meta.* workflow | medium | medium | medium | 3 | D3 |
| CLI-016 | meta.deleted_true=438,979 (8.5%) | skip vs inactive publication | high | medium | high | 3 | D3 |
| CLI-017 | meta.approved_false_or_missing=26,545 | approved gate | high | medium | medium | 2 | D3 |
| CLI-018 | Transform: skipped_deleted=77/11000 | deleted in master dump | medium | low | medium | 2 | D3 |
| CLI-019 | Confluence CRON ETL gating | EventBridge processor gating | medium | medium | medium | 3 | D3 |
| CLI-020 | product_stock_empty=973,287 (20.4%) | Shopware product.stock | high | medium | high | 4 | D4 |
| CLI-021 | quantity_on_hand_missing=2,735,879 (75.4%) | Salable stock qty | high | medium | high | 4 | D4 |
| CLI-022 | availability nla=2,571,968 | NLA ≠ qty zero UX | medium | medium | medium | 3 | D4 |
| CLI-023 | product_stock_missing_inventory=15 | orphan stock refs | low | low | low | 1 | D4 |
| CLI-024 | Transform: stock_fallback_used=1054/11000 (9.6%) | zero default distorts salability | medium | medium | medium | 2 | D4 |
| CLI-025 | price_unparseable=3,670 | Shopware price[] | medium | low | medium | 2 | D4 |
| CLI-026 | Confluence EventBridge; 5M+ scale | Compact ID-only events | critical | medium | high | 5 | D5 |
| CLI-027 | Change Stream Consumer design | Strip full doc before bus | high | medium | medium | 4 | D5 |
| CLI-028 | Transform: success=7879/11000; blocked_model=923 | OD01 undecided blocks models | critical | high | high | 6 | D1 |

## Transform dry-run stats (latest)

```json
{
  "input_rows": 11000,
  "success": 7879,
  "skipped_deleted": 77,
  "blocked_model_mapping": 923,
  "blocked_no_media": 2065,
  "blocked_price_parse": 56,
  "stock_fallback_used": 1054,
  "error_rate": 0.284
}
```

## Schema validation (2026-06-02)

`validate_schema.mjs --all-examples`: **pass** — 50/50 normalized-product, 5/5 compact-sync-event, 20/20 shopware-product-write.

## Related artifacts

- NL gap narrative: [client-data-gap-profile.md](./client-data-gap-profile.md)
- Diagrams: [schema-difficulty-diagrams.md](./schema-difficulty-diagrams.md)
- DeepWiki target patterns: [../discoveries/assessment/docs/deepwiki-target-ideal.md](../discoveries/assessment/docs/deepwiki-target-ideal.md)
