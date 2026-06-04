# Restore proof — sample source snapshot

## Scope

This proof documents the **local sample archive** boundary for migration analysis. It does **not** prove live DocumentDB restore.

## Archive chain

1. `agent-skills-collection/docs/input-sample-data.zip` (702,570,094 bytes; SHA256 `e31a36c49a7439c9f971e2af6e4de5aee803518d67700dff5aa981620cc4ebf9`)
2. Inner `Opulent/catalog.zip` (702,567,387 bytes; SHA256 `7a0883a1dd7c4ac6ce019072b70a3e8ca1db31f5528249dc4fa0ddbc63965c4b`)
3. Inner `Opulent/partstree_catalog_shopware_overview.md` (2,371 bytes)

## Local extract (verified 2026-06-02)

**Path:** `NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/client-data/snapshot/`

| File | Size (bytes) | SHA256 |
|------|-------------:|--------|
| `catalog/catalog/products.bson` | 3,744,991,263 | `f183ee27107831230cb8757cd2688b2439ddad19ff05578fc67212d7282c28cd` |
| `catalog/catalog/inventory.bson` | 1,580,222,283 | `08c8e7c464c38ce55ae7d2740d4cc9061a6e5a1cfa0be901ad657413ea52b3ca` |
| `catalog/catalog/accounts.bson` | 0 (empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Large BSON and nested `catalog.zip` are listed in `migration/data/.gitignore` (checksums in `source_snapshot_manifest.json`).

## Restore steps (local)

```bash
cd agent-skills-collection/docs
unzip -o input-sample-data.zip -d ../../NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/client-data/snapshot
cd ../../NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/client-data/snapshot
unzip -o Opulent/catalog.zip -d catalog
shasum -a 256 catalog/catalog/products.bson catalog/catalog/inventory.bson
```

## Spot-check (prior session)

- Full decode of `products` and `inventory` BSON completed (see `decision-log.tsv` rows 5–6).
- Counts match `blocker-strategy-report.md` and `local-migration-dry-run-summary.json`.

## Rerun profiling

```bash
python3 agent/scripts/profile_source_bson.py
```

Streams BSON from nested zip (no full disk extract required). Writes `discoveries/profiles/source_profile.json` (verified 2026-06-02).

## Verdict

| Check | Result |
|-------|--------|
| Archive readable on disk | PASS |
| Per-file BSON checksums in manifest | PASS (products, inventory, accounts) |
| `source_profile.json` from real BSON | PASS (2026-06-02) |
| Full assets/IPL collections | FAIL (deferred) |
| Live DocumentDB restore | NOT IN SCOPE |

**Overall: INCONCLUSIVE** — checksums verified for present collections; production source freeze still blocked on assets/attributes and live access (G0).
