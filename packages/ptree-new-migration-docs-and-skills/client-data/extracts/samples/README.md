# Client data extracts (committed)

Small JSON/JSONL slices for agent analysis **without** Git LFS or full BSON on disk.

| File | Contents |
|------|----------|
| `source_profile.json` | Streamed aggregate metrics (synced from `discoveries/profiles/`) |
| `samples/products-parts-sample.jsonl` | 500 `type=part` documents (bucketed: deleted, unapproved, empty stock, IPL, photos) |
| `samples/products-models-sample.jsonl` | 200 `type=model` documents (prioritizes non-empty `ipl` — IPL linkage is on models in this archive) |
| `samples/inventory-sample.jsonl` | 500 inventory rows |
| `field-catalog.json` | Key frequency from sample scan |
| `manifest.json` | Full-archive checksums & what is **not** in git |

## Regenerate

From package root:

```bash
python3 agent/scripts/build_data_extracts.py
```

Requires `client-data/snapshot/catalog/catalog/*.bson` **or** `docs/input-sample-data.zip` (LFS) at repo root.

Full production-scale BSON and `assets.bson` remain external — see `manifest.json`.
