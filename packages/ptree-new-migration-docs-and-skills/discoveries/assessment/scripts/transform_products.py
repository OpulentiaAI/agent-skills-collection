#!/usr/bin/env python3
"""Stream BSON products/inventory → normalized JSONL (assessment sample limits)."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from bson import decode_file_iter

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_PRODUCTS = ROOT / "client-data/snapshot/catalog/catalog/products.bson"
DEFAULT_INVENTORY = ROOT / "client-data/snapshot/catalog/catalog/inventory.bson"
FALLBACK_ZIP_SCRIPT = ROOT / "agent/scripts/profile_source_bson.py"


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


def brand_keys(doc: dict) -> list[str]:
    keys = []
    for field in ("marketing_brand", "manufacturing_brand"):
        val = doc.get(field)
        if isinstance(val, list):
            keys.extend(str(x).strip() for x in val if x)
        elif isinstance(val, str) and val.strip():
            keys.append(val.strip())
    return sorted(set(keys))


def payload_hash(obj: dict) -> str:
    raw = json.dumps(obj, sort_keys=True, default=str)
    return "sha256:" + hashlib.sha256(raw.encode()).hexdigest()


def load_inventory_index(path: Path, needed_keys: set[str] | None = None) -> dict[str, dict]:
    index: dict[str, dict] = {}
    if not path.exists():
        return index
    for doc in decode_file_iter(path.open("rb")):
        src = doc.get("source")
        if not isinstance(src, str) or not src.strip():
            continue
        key = src.strip()
        if needed_keys is not None and key not in needed_keys:
            continue
        index[key] = doc
        if needed_keys is not None and len(index) >= len(needed_keys):
            break
    return index


def collect_sample_docs(products_path: Path, part_limit: int, model_limit: int) -> tuple[list[dict], list[dict]]:
    parts: list[dict] = []
    models: list[dict] = []
    for doc in decode_file_iter(products_path.open("rb")):
        t = doc.get("type")
        if t == "part" and len(parts) < part_limit:
            parts.append(doc)
        elif t == "model" and len(models) < model_limit:
            models.append(doc)
        if len(parts) >= part_limit and len(models) >= model_limit:
            break
    return parts, models


def stock_refs_from_parts(parts: list[dict]) -> set[str]:
    refs: set[str] = set()
    for doc in parts:
        stock = doc.get("stock")
        if isinstance(stock, str) and stock.strip():
            refs.add(stock.strip())
    return refs


def workflow_status(doc: dict) -> str:
    if truthy(meta_flag(doc, "deleted")):
        return "skipped_deleted"
    if not truthy(meta_flag(doc, "approved")):
        return "skipped_unapproved"
    review = meta_flag(doc, "review")
    if review not in (None, "", [], False):
        return "skipped_review"
    return "loadable"


def normalize_part(doc: dict, inventory_index: dict[str, dict]) -> dict:
    stock = doc.get("stock")
    stock_ref = stock.strip() if isinstance(stock, str) else (str(stock) if stock else None)
    wf = workflow_status(doc)
    photos = doc.get("photos") or []
    photos_refs = [str(p) for p in photos if p]

    stock_join_status = "missing_ref"
    inventory = None
    if stock_ref:
        inv = inventory_index.get(stock_ref)
        if inv is None:
            stock_join_status = "missing_inventory"
        elif truthy(meta_flag(inv, "deleted")):
            stock_join_status = "inventory_deleted"
        else:
            stock_join_status = "joined"
            ok, price = parse_price(inv.get("price"))
            qty = inv.get("quantity_on_hand")
            qty_status = "absent"
            if qty is not None:
                qty_status = "zero" if qty == 0 else "present"
            inventory = {
                "price": price if ok else None,
                "price_parse_ok": ok,
                "availability": inv.get("availability"),
                "quantity_on_hand": int(qty) if qty is not None else None,
                "quantity_status": qty_status,
            }

    media_status = "empty_refs"
    if photos_refs:
        media_status = "blocked_no_assets_collection"

    row = {
        "source_id": doc.get("source"),
        "entity_type": "part",
        "title": doc.get("title"),
        "workflow_status": wf,
        "meta_approved": truthy(meta_flag(doc, "approved")),
        "meta_deleted": truthy(meta_flag(doc, "deleted")),
        "meta_review": meta_flag(doc, "review"),
        "stock_ref": stock_ref,
        "stock_join_status": stock_join_status,
        "inventory": inventory,
        "photos_refs": photos_refs,
        "media_status": media_status,
        "brand_keys": brand_keys(doc),
    }
    row["payload_hash"] = payload_hash(row)
    return row


def normalize_model(doc: dict) -> dict:
    wf = workflow_status(doc)
    if wf == "loadable":
        wf = "blocked_od01_mapping"
    ipl = doc.get("ipl") or []
    ipl_refs = [str(x) for x in ipl if x]
    row = {
        "source_id": doc.get("source"),
        "entity_type": "model",
        "model_name": doc.get("model_name"),
        "product_family": doc.get("product_family"),
        "workflow_status": wf,
        "shopware_target_decision": "UNDECIDED_OD01",
        "ipl_refs": ipl_refs,
        "brand_keys": brand_keys(doc),
        "photos_refs": [str(p) for p in (doc.get("photos") or []) if p],
    }
    row["payload_hash"] = payload_hash(row)
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--products", type=Path, default=DEFAULT_PRODUCTS)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--part-limit", type=int, default=10000)
    parser.add_argument("--model-limit", type=int, default=1000)
    args = parser.parse_args()

    if not args.products.exists():
        print(f"Missing products.bson: {args.products}", file=sys.stderr)
        return 1

    print("Collecting product sample …", flush=True)
    parts, models = collect_sample_docs(args.products, args.part_limit, args.model_limit)
    needed_keys = stock_refs_from_parts(parts)
    print(f"Sample: {len(parts)} parts, {len(models)} models, {len(needed_keys)} stock refs", flush=True)

    print("Loading inventory subset …", flush=True)
    inventory_index = load_inventory_index(args.inventory, needed_keys)
    print(f"Inventory keys loaded: {len(inventory_index)}", flush=True)

    part_count = 0
    model_count = 0
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open("w") as out:
        for doc in parts:
            out.write(json.dumps(normalize_part(doc, inventory_index), default=str) + "\n")
            part_count += 1
        for doc in models:
            out.write(json.dumps(normalize_model(doc), default=str) + "\n")
            model_count += 1

    stats = {"parts_normalized": part_count, "models_normalized": model_count}
    print(json.dumps(stats))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
