#!/usr/bin/env python3
"""Stream-profile MongoDB BSON dumps inside Opulent/catalog.zip (no full extract)."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from bson import decode_file_iter

PKG_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = PKG_ROOT.parent.parent
DISCOVERIES = PKG_ROOT / "discoveries"
SAMPLE_ZIP = REPO_ROOT / "agent-skills-collection/docs/input-sample-data.zip"
CATALOG_INNER = "Opulent/catalog.zip"


def iter_bson_from_nested_zip(outer: Path, inner_zip_name: str, bson_member: str):
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


def parse_price(val: Any) -> tuple[bool, float | None]:
    if val is None:
        return False, None
    if isinstance(val, (int, float, Decimal)):
        return True, float(val)
    if isinstance(val, str):
        s = val.strip().replace(",", "")
        if not s:
            return False, None
        try:
            return True, float(s)
        except ValueError:
            return False, None
    return False, None


def type_name(val: Any) -> str:
    if val is None:
        return "null"
    return type(val).__name__


def sample_fields(doc: dict, prefix: str = "", depth: int = 0, out: dict | None = None) -> dict:
    out = out or {}
    if depth > 2:
        return out
    for k, v in doc.items():
        path = f"{prefix}.{k}" if prefix else k
        if path not in out:
            out[path] = {"types": Counter(), "example": None}
        out[path]["types"][type_name(v)] += 1
        if out[path]["example"] is None and v is not None and not isinstance(v, (dict, list)):
            out[path]["example"] = v if not isinstance(v, bytes) else "<bytes>"
        if isinstance(v, dict) and depth < 2:
            sample_fields(v, path, depth + 1, out)
        elif isinstance(v, list) and v and depth < 2 and isinstance(v[0], dict):
            sample_fields(v[0], f"{path}[]", depth + 1, out)
    return out


def profile_products(docs_iter, sample_n: int = 5) -> dict:
    counts = Counter()
    types = Counter()
    flags = Counter()
    brands = Counter()
    samples: list[dict] = []
    field_samples: dict = {}

    for i, doc in enumerate(docs_iter):
        counts["documents"] += 1
        t = (doc.get("type") or "unknown").strip() if isinstance(doc.get("type"), str) else str(doc.get("type"))
        types[t] += 1

        approved = meta_flag(doc, "approved")
        deleted = meta_flag(doc, "deleted")
        review = meta_flag(doc, "review")
        sync = doc.get("sync")
        if meta_flag(doc, "sync") is not None:
            sync = meta_flag(doc, "sync")

        if truthy(approved):
            flags["meta.approved_true"] += 1
        else:
            flags["meta.approved_false_or_missing"] += 1
        if truthy(deleted):
            flags["meta.deleted_true"] += 1
        if review not in (None, "", []):
            flags["meta.review_nonempty"] += 1
        if sync is not None:
            flags["sync_field_present"] += 1
            if truthy(sync):
                flags["sync_true"] += 1

        if empty(doc.get("stock")):
            flags["stock_empty"] += 1
        if empty(doc.get("photos")):
            flags["photos_empty"] += 1
        if empty(doc.get("equipment_type")):
            flags["equipment_type_empty"] += 1
        if doc.get("ipl") not in (None, [], {}):
            flags["ipl_field_present"] += 1

        mb = doc.get("marketing_brand")
        if isinstance(mb, list) and mb:
            brands[str(mb[0])[:80]] += 1
        elif isinstance(mb, str) and mb:
            brands[mb[:80]] += 1

        if len(samples) < sample_n:
            samples.append(
                {
                    "source": doc.get("source"),
                    "type": doc.get("type"),
                    "meta": doc.get("meta"),
                    "stock": doc.get("stock"),
                    "photos_len": len(doc.get("photos") or []),
                    "marketing_brand": doc.get("marketing_brand"),
                    "manufacturing_brand": doc.get("manufacturing_brand"),
                }
            )
        if i < 200:
            sample_fields(doc, out=field_samples)

    schema = {
        k: {
            "types": dict(v["types"]),
            "example": v["example"],
        }
        for k, v in sorted(field_samples.items())[:60]
    }
    return {
        "document_count": counts["documents"],
        "type_distribution": dict(types),
        "workflow_flags": dict(flags),
        "top_marketing_brand_samples": brands.most_common(15),
        "record_samples": samples,
        "schema_sample_first_200_docs": schema,
    }


def profile_inventory(docs_iter, inventory_sources: set[str], sample_n: int = 5) -> dict:
    flags = Counter()
    availability = Counter()
    samples: list[dict] = []
    field_samples: dict = {}
    max_price = 0.0
    doc_count = 0

    for i, doc in enumerate(docs_iter):
        doc_count += 1
        src = doc.get("source")
        if isinstance(src, str):
            inventory_sources.add(src.strip())

        if truthy(meta_flag(doc, "approved")):
            flags["meta.approved_true"] += 1
        else:
            flags["meta.approved_false_or_missing"] += 1
        if truthy(meta_flag(doc, "deleted")):
            flags["meta.deleted_true"] += 1
        if meta_flag(doc, "review") not in (None, "", []):
            flags["meta.review_nonempty"] += 1

        if empty(doc.get("quantity_on_hand")):
            flags["quantity_on_hand_missing"] += 1
        if empty(doc.get("source_touch")):
            flags["source_touch_missing"] += 1

        ok, price = parse_price(doc.get("price"))
        if not ok:
            flags["price_unparseable"] += 1
        elif price is not None:
            if price > 100000:
                flags["price_outlier_gt_100k"] += 1
            if price > max_price:
                max_price = price

        av = doc.get("availability")
        if av is not None:
            availability[str(av)] += 1

        if len(samples) < sample_n:
            samples.append(
                {
                    "source": doc.get("source"),
                    "price": doc.get("price"),
                    "availability": doc.get("availability"),
                    "quantity_on_hand": doc.get("quantity_on_hand"),
                    "meta": doc.get("meta"),
                }
            )
        if i < 200:
            sample_fields(doc, out=field_samples)

    return {
        "document_count": doc_count,
        "workflow_flags": dict(flags),
        "availability_distribution": dict(availability),
        "max_observed_price": max_price,
        "record_samples": samples,
        "schema_sample_first_200_docs": {
            k: {"types": dict(v["types"]), "example": v["example"]}
            for k, v in sorted(field_samples.items())[:40]
        },
    }


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    if not SAMPLE_ZIP.exists():
        print(f"Missing sample zip: {SAMPLE_ZIP}", file=sys.stderr)
        return 1

    outer_sha = sha256_file(SAMPLE_ZIP)
    print("Profiling products.bson …", flush=True)
    products = profile_products(
        iter_bson_from_nested_zip(SAMPLE_ZIP, CATALOG_INNER, "catalog/products.bson")
    )
    print("Profiling inventory.bson …", flush=True)
    inventory_sources: set[str] = set()
    inventory = profile_inventory(
        iter_bson_from_nested_zip(SAMPLE_ZIP, CATALOG_INNER, "catalog/inventory.bson"),
        inventory_sources,
    )

    with zipfile.ZipFile(SAMPLE_ZIP) as oz:
        with oz.open(CATALOG_INNER) as inner_bytes:
            with zipfile.ZipFile(inner_bytes) as cz:
                members = cz.namelist()
                bson_files = [m for m in members if m.endswith(".bson")]
                meta_only_assets = [
                    m
                    for m in members
                    if "assets" in m.lower() and m.endswith(".metadata.json")
                ]

    # Join check: products.stock -> inventory.source
    print("Join check products.stock → inventory.source …", flush=True)
    join = Counter()
    for doc in iter_bson_from_nested_zip(SAMPLE_ZIP, CATALOG_INNER, "catalog/products.bson"):
        stock = doc.get("stock")
        if empty(stock):
            join["product_stock_empty"] += 1
            continue
        key = stock.strip() if isinstance(stock, str) else str(stock)
        if key in inventory_sources:
            join["product_stock_join_ok"] += 1
        else:
            join["product_stock_missing_inventory"] += 1

    profile = {
        "profile_id": "opulent-sample-bson-2026-06-02",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_environment": "sample_archive_not_live_documentdb",
        "archive": {
            "path": str(SAMPLE_ZIP.relative_to(ROOT)),
            "sha256": outer_sha,
            "inner_catalog_zip": CATALOG_INNER,
        },
        "catalog_zip_bson_members": bson_files,
        "collections_present": {
            "products": {"bson": "catalog/products.bson", **products},
            "inventory": {"bson": "catalog/inventory.bson", **inventory},
            "accounts": {
                "bson": "catalog/accounts.bson",
                "document_count": 0,
                "notes": "empty bson in sample archive",
            },
            "assets": {
                "bson": None,
                "document_count": 0,
                "status": "missing",
                "notes": "no assets.bson; only assets_staging_incremental_*.metadata.json stubs",
                "metadata_stubs": len(meta_only_assets),
            },
            "attributes": {
                "bson": None,
                "status": "missing",
                "notes": "no attributes.bson in archive",
            },
            "brands_models_ipls": {
                "notes": "No separate brands/models/IPL collections; hierarchy encoded in products.type and products.ipl/assets joins",
                "products_type_distribution": products["type_distribution"],
                "products_with_ipl_field": products["workflow_flags"].get("ipl_field_present", 0),
            },
        },
        "join_metrics": {
            "products_stock_to_inventory_source": dict(join),
            "inventory_source_distinct_count": len(inventory_sources),
        },
        "intent_alignment_notes": [
            "Confluence/doc intent expects Brand→Model→IPL→Parts hierarchy in Shopware; source uses single products collection with type=part|model and separate assets/IPL data not in sample.",
            "Workflow gating documented as sync/review/approved/deleted; BSON uses meta.approved, meta.deleted, meta.review (sync rarely present on sampled paths).",
            "Media/IPL load groups require assets.bson + plugin contract; sample archive blocks G1 media/IPL verification.",
        ],
        "verification_owner": "Source Profile Agent",
        "profile_verdict": "MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE",
    }

    out_path = DISCOVERIES / "profiles" / "source_profile.json"
    out_path.write_text(json.dumps(profile, indent=2, default=str) + "\n")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
