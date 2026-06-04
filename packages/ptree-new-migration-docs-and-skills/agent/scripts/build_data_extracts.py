#!/usr/bin/env python3
"""Build committed client-data/extracts from BSON (stream; no full RAM load)."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterator

from bson import decode_file_iter
from bson.json_util import dumps as bson_dumps

PKG_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = PKG_ROOT.parent.parent
EXTRACTS = PKG_ROOT / "client-data" / "extracts"
PROFILE_SRC = PKG_ROOT / "discoveries" / "profiles" / "source_profile.json"
MANIFEST_SRC = PKG_ROOT / "client-data" / "manifests" / "source_snapshot_manifest.json"
SAMPLE_ZIP = REPO_ROOT / "docs" / "input-sample-data.zip"
CATALOG_INNER = "Opulent/catalog.zip"
SYNC_PKG = Path("/Users/jeremyalston/Downloads/AltusNova/NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills")


def iter_bson_file(path: Path) -> Iterator[dict]:
    with path.open("rb") as f:
        yield from decode_file_iter(f)


def iter_bson_from_nested_zip(outer: Path, inner_zip_name: str, bson_member: str) -> Iterator[dict]:
    with zipfile.ZipFile(outer) as oz:
        with oz.open(inner_zip_name) as inner_bytes:
            with zipfile.ZipFile(inner_bytes) as cz:
                with cz.open(bson_member) as bf:
                    yield from decode_file_iter(bf)


def truthy(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val != 0
    if isinstance(val, str):
        return val.strip().lower() not in ("", "false", "0", "no", "null", "none")
    return True


def meta_flag(doc: dict, key: str) -> Any:
    meta = doc.get("meta") or {}
    if isinstance(meta, dict) and key in meta:
        return meta[key]
    return doc.get(key)


def empty(val: Any) -> bool:
    if val is None:
        return True
    if isinstance(val, str):
        return not val.strip()
    if isinstance(val, (list, dict)):
        return len(val) == 0
    return False


def resolve_bson_sources() -> tuple[Path | None, Callable[[str], Iterator[dict]]]:
    """Return (snapshot_dir_or_none, opener(member_name) -> iter). member like catalog/products.bson"""
    snap = PKG_ROOT / "client-data" / "snapshot" / "catalog" / "catalog"
    products = snap / "products.bson"
    if products.is_file() and products.stat().st_size > 0:
        def open_member(member: str) -> Iterator[dict]:
            name = Path(member).name
            p = snap / name
            if not p.is_file():
                raise FileNotFoundError(p)
            return iter_bson_file(p)

        return snap, open_member

    nd = SYNC_PKG / "client-data" / "snapshot" / "catalog" / "catalog"
    if (nd / "products.bson").is_file():
        def open_member_nd(member: str) -> Iterator[dict]:
            name = Path(member).name
            p = nd / name
            if not p.is_file():
                raise FileNotFoundError(p)
            return iter_bson_file(p)

        return nd, open_member_nd

    if SAMPLE_ZIP.is_file():

        def open_member_zip(member: str) -> Iterator[dict]:
            return iter_bson_from_nested_zip(SAMPLE_ZIP, CATALOG_INNER, member)

        return None, open_member_zip

    raise SystemExit("No BSON source: snapshot extract or docs/input-sample-data.zip")


def part_buckets(doc: dict) -> list[str]:
    if (doc.get("type") or "").strip().lower() != "part":
        return []
    tags = []
    if truthy(meta_flag(doc, "deleted")):
        tags.append("deleted")
    if not truthy(meta_flag(doc, "approved")):
        tags.append("unapproved")
    if empty(doc.get("stock")):
        tags.append("empty_stock")
    if doc.get("ipl") not in (None, [], {}):
        tags.append("with_ipl")
    if not empty(doc.get("photos")):
        tags.append("with_photos")
    return tags or ["other"]


def write_jsonl(path: Path, docs: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as out:
        for doc in docs:
            out.write(bson_dumps(doc))
            out.write("\n")


def sample_products_parts(open_member: Callable[[str], Iterator[dict]], target: int = 500) -> list[dict]:
    buckets: dict[str, list[dict]] = defaultdict(list)
    fill_order = ["deleted", "unapproved", "empty_stock", "with_ipl", "with_photos", "other"]
    per_bucket_cap = max(40, target // len(fill_order))

    for doc in open_member("catalog/products.bson"):
        for tag in part_buckets(doc):
            if len(buckets[tag]) < per_bucket_cap:
                buckets[tag].append(doc)

    chosen: list[dict] = []
    seen_ids: set[Any] = set()

    def add_doc(d: dict) -> None:
        oid = d.get("_id")
        if oid in seen_ids:
            return
        seen_ids.add(oid)
        chosen.append(d)

    for tag in fill_order:
        for d in buckets.get(tag, []):
            if len(chosen) >= target:
                break
            add_doc(d)

    if len(chosen) < target:
        for doc in open_member("catalog/products.bson"):
            if (doc.get("type") or "").strip().lower() != "part":
                continue
            if len(chosen) >= target:
                break
            add_doc(doc)

    return chosen[:target]


def sample_products_models(open_member: Callable[[str], Iterator[dict]], target: int = 200) -> list[dict]:
    out: list[dict] = []
    for doc in open_member("catalog/products.bson"):
        if (doc.get("type") or "").strip().lower() != "model":
            continue
        out.append(doc)
        if len(out) >= target:
            break
    return out


def sample_inventory(open_member: Callable[[str], Iterator[dict]], target: int = 500) -> list[dict]:
    out: list[dict] = []
    for doc in open_member("catalog/inventory.bson"):
        out.append(doc)
        if len(out) >= target:
            break
    return out


def build_field_catalog(docs: list[dict], max_depth: int = 2) -> dict:
    key_counts: Counter[str] = Counter()
    nested: dict[str, Counter[str]] = defaultdict(Counter)

    def walk(obj: Any, prefix: str, depth: int) -> None:
        if depth > max_depth or not isinstance(obj, dict):
            return
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else k
            key_counts[path] += 1
            if isinstance(v, dict) and depth < max_depth:
                walk(v, path, depth + 1)
            elif isinstance(v, list) and v and isinstance(v[0], dict) and depth < max_depth:
                walk(v[0], f"{path}[]", depth + 1)

    for doc in docs:
        walk(doc, "", 0)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documents_scanned": len(docs),
        "top_level_and_nested_key_frequency": dict(key_counts.most_common(120)),
    }


def sync_profile() -> Path:
    dest = EXTRACTS / "source_profile.json"
    EXTRACTS.mkdir(parents=True, exist_ok=True)
    if PROFILE_SRC.is_file():
        shutil.copy2(PROFILE_SRC, dest)
    return dest


def build_manifest(profile: dict | None) -> dict:
    base: dict = {}
    if MANIFEST_SRC.is_file():
        base = json.loads(MANIFEST_SRC.read_text())
    collections = []
    for c in base.get("collections", []):
        collections.append(c)
    not_in_git = [
        "catalog/products.bson (full ~3.5GB)",
        "catalog/inventory.bson (full ~1.5GB)",
        "catalog/assets.bson (missing in sample archive)",
        "catalog/attributes.bson (missing)",
        "agent-skills-collection/docs/input-sample-data.zip (Git LFS)",
        "Opulent/catalog.zip inner archive",
    ]
    outer_sha = None
    if profile and profile.get("archive"):
        outer_sha = profile["archive"].get("sha256")
    elif base.get("archive_paths"):
        outer_sha = base["archive_paths"][0].get("outer_zip_sha256")

    return {
        "extract_id": "client-data-extracts-2026-06-04",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "package_root": str(PKG_ROOT.name),
        "full_bson_sha256_from_manifest": {
            c.get("name"): c.get("checksum_sha256")
            for c in collections
            if c.get("checksum_sha256")
        },
        "collection_document_counts": {
            c.get("name"): c.get("document_count") for c in collections
        },
        "outer_sample_zip_sha256": outer_sha,
        "committed_in_git": [
            "source_profile.json",
            "manifest.json",
            "field-catalog.json",
            "samples/*.jsonl",
            "samples/README.md",
            "overview.md",
        ],
        "not_in_git_requires_lfs_or_local_extract": not_in_git,
        "notes": base.get("deferrals", []),
    }


def build_overview(profile: dict) -> str:
    products = profile.get("collections_present", {}).get("products", {})
    inv = profile.get("collections_present", {}).get("inventory", {})
    lines = [
        "# Catalog sample overview (extracts)",
        "",
        "Derived from `source_profile.json` — **sample archive, not production freeze**.",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Products documents | {products.get('document_count', '—'):,} |" if isinstance(products.get("document_count"), int) else f"| Products documents | {products.get('document_count', '—')} |",
        f"| Inventory documents | {inv.get('document_count', '—'):,} |" if isinstance(inv.get("document_count"), int) else f"| Inventory documents | {inv.get('document_count', '—')} |",
        f"| Part / model split | {products.get('type_distribution', {})} |",
        f"| Profile verdict | {profile.get('profile_verdict', '—')} |",
        "",
        "For row-level inspection use `samples/*.jsonl`. Full BSON remains outside git (see `manifest.json`).",
        "",
    ]
    return "\n".join(lines)


def dir_size(path: Path) -> int:
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            total += p.stat().st_size
    return total


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parts", type=int, default=500)
    parser.add_argument("--models", type=int, default=200)
    parser.add_argument("--inventory", type=int, default=500)
    parser.add_argument("--max-mb", type=float, default=25.0, help="Reduce samples if total exceeds this")
    args = parser.parse_args()

    snap_dir, open_member = resolve_bson_sources()
    print(f"BSON source: {snap_dir or SAMPLE_ZIP}", flush=True)

    EXTRACTS.mkdir(parents=True, exist_ok=True)
    samples_dir = EXTRACTS / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    sync_profile()
    profile = json.loads((EXTRACTS / "source_profile.json").read_text()) if (EXTRACTS / "source_profile.json").is_file() else None

    parts = sample_products_parts(open_member, args.parts)
    models = sample_products_models(open_member, args.models)
    inventory = sample_inventory(open_member, args.inventory)

    write_jsonl(samples_dir / "products-parts-sample.jsonl", parts)
    write_jsonl(samples_dir / "products-models-sample.jsonl", models)
    write_jsonl(samples_dir / "inventory-sample.jsonl", inventory)

    catalog_docs = parts[:200] + models[:50] + inventory[:100]
    (EXTRACTS / "field-catalog.json").write_text(
        json.dumps(build_field_catalog(catalog_docs), indent=2) + "\n"
    )
    (EXTRACTS / "manifest.json").write_text(json.dumps(build_manifest(profile), indent=2) + "\n")

    if profile:
        (EXTRACTS / "overview.md").write_text(build_overview(profile))

    readme = f"""# Client data extracts (committed)

Small JSON/JSONL slices for agent analysis **without** Git LFS or full BSON on disk.

| File | Contents |
|------|----------|
| `source_profile.json` | Streamed aggregate metrics (synced from `discoveries/profiles/`) |
| `samples/products-parts-sample.jsonl` | {len(parts)} `type=part` documents (bucketed: deleted, unapproved, empty stock, IPL, photos) |
| `samples/products-models-sample.jsonl` | {len(models)} `type=model` documents |
| `samples/inventory-sample.jsonl` | {len(inventory)} inventory rows |
| `field-catalog.json` | Key frequency from sample scan |
| `manifest.json` | Full-archive checksums & what is **not** in git |

## Regenerate

From package root:

```bash
python3 agent/scripts/build_data_extracts.py
```

Requires `client-data/snapshot/catalog/catalog/*.bson` **or** `docs/input-sample-data.zip` (LFS) at repo root.

Full production-scale BSON and `assets.bson` remain external — see `manifest.json`.
"""
    (samples_dir / "README.md").write_text(readme)

    total = dir_size(EXTRACTS)
    max_bytes = int(args.max_mb * 1024 * 1024)
    if total > max_bytes and args.parts > 100:
        print(f"Extracts {total/1e6:.1f}MB > {args.max_mb}MB — retrying with smaller samples", flush=True)
        for f in samples_dir.glob("*.jsonl"):
            f.unlink()
        parts = sample_products_parts(open_member, 200)
        models = sample_products_models(open_member, 80)
        inventory = sample_inventory(open_member, 200)
        write_jsonl(samples_dir / "products-parts-sample.jsonl", parts)
        write_jsonl(samples_dir / "products-models-sample.jsonl", models)
        write_jsonl(samples_dir / "inventory-sample.jsonl", inventory)
        total = dir_size(EXTRACTS)

    print(f"Wrote {EXTRACTS} ({total/1e6:.2f} MB)")
    if SYNC_PKG.is_dir():
        dest = SYNC_PKG / "client-data" / "extracts"
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(EXTRACTS, dest)
        print(f"Synced to {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
