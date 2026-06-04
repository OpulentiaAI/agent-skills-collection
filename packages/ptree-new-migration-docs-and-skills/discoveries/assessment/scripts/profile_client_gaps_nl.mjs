#!/usr/bin/env node
/**
 * Client-only gap profile: BSON stats + natural-language narrative.
 * Sources: input-sample-data.zip / extracted BSON + Confluence PDF (via source_profile.json counts).
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(__dirname, '../../..')
const REPO = path.resolve(PKG, '../..')
const PROFILE_JSON = path.join(PKG, 'discoveries/profiles/source_profile.json')
const OUT_MD = path.join(PKG, 'notes/guides/client-data-gap-profile.md')

function loadProfile () {
  if (!fs.existsSync(PROFILE_JSON)) {
    runProfileScript()
  }
  return JSON.parse(fs.readFileSync(PROFILE_JSON, 'utf8'))
}

function runProfileScript () {
  const script = path.join(PKG, 'agent/scripts/profile_source_bson.py')
  if (!fs.existsSync(script)) {
    throw new Error(`Missing profile script: ${script}`)
  }
  const r = spawnSync('python3', [script], { encoding: 'utf8', cwd: REPO })
  if (r.status !== 0) throw new Error(r.stderr || r.stdout)
}

function pct (n, d) {
  return d ? ((100 * n) / d).toFixed(1) : '0.0'
}

function narrative (p) {
  const prod = p.collections_present.products
  const inv = p.collections_present.inventory
  const assets = p.collections_present.assets
  const join = p.join_metrics?.products_stock_to_inventory_source ?? {}

  const wf = prod.workflow_flags
  const invWf = inv.workflow_flags
  const totalParts = prod.type_distribution.part
  const totalModels = prod.type_distribution.model

  return `# Client data gap profile

Generated: ${new Date().toISOString()}

**Evidence scope:** Confluence export \`Confluence-PTREE-010626-130110.pdf\`, BSON sample archive (\`input-sample-data.zip\` → \`Opulent/catalog.zip\`), and \`partstree_catalog_shopware_overview.md\`. Counts below are measured from streaming BSON — not consulting gate artifacts.

---

## Hierarchy mismatch (single collection vs Brand→Model→IPL→Parts)

Confluence and the client overview describe a five-level merchandise tree (Brand → Brand Family → Model → Model Variant → IPL → Parts). The sample BSON contains **no separate** \`brands\`, \`models\`, or \`ipls\` collections — only \`products.bson\` with \`type=part\` (${totalParts.toLocaleString()} docs) and \`type=model\` (${totalModels.toLocaleString()} docs). IPL relationships appear as string refs on model rows (\`products.ipl\` present on **${wf.ipl_field_present.toLocaleString()}** models, ~${pct(wf.ipl_field_present, totalModels)}% of models).

**Schema difficulty:** Shopware expects navigable category trees and/or custom entities for IPL diagrams. The source encodes hierarchy implicitly inside one polymorphic collection. Every loader must branch on \`type\`, infer brand family from \`product_family\` / \`marketing_brand\`, and resolve IPL refs against a missing \`assets\` collection — multiplying transform rules and reconciliation surfaces.

---

## Workflow semantics (sync / review / approved / deleted)

Confluence documents cataloger flags: **sync** (scheduled for sync), **review** (QA queue), **approved** (ready for downstream), **deleted** (soft delete). In BSON, workflow lives under \`meta.approved\`, \`meta.deleted\`, \`meta.review\`; top-level \`sync\` is rarely populated on sampled paths.

Measured on **${prod.document_count.toLocaleString()}** product docs:

- \`meta.approved=true\`: **${wf['meta.approved_true'].toLocaleString()}** (${pct(wf['meta.approved_true'], prod.document_count)}%)
- \`meta.approved\` false/missing: **${wf['meta.approved_false_or_missing'].toLocaleString()}**
- \`meta.deleted=true\`: **${wf['meta.deleted_true'].toLocaleString()}** (${pct(wf['meta.deleted_true'], prod.document_count)}%)

**Transform impact:** ~${pct(wf['meta.deleted_true'], prod.document_count)}% of catalog rows are soft-deleted but still present in the master dump. Shopware publication policy must explicitly choose skip vs inactive load. Unapproved rows (${wf['meta.approved_false_or_missing'].toLocaleString()}) cannot reach storefront without overriding Confluence's approval contract.

---

## Stock / inventory join complexity

Parts reference stock via \`products.stock\` → \`inventory.source\`. Join metrics on full corpus:

| Outcome | Count |
|---------|------:|
| Join OK | ${join.product_stock_join_ok?.toLocaleString() ?? 'n/a'} |
| Empty \`products.stock\` | ${join.product_stock_empty?.toLocaleString() ?? 'n/a'} (${pct(join.product_stock_empty, totalParts)}% of parts) |
| Stock ref missing in inventory | ${join.product_stock_missing_inventory?.toLocaleString() ?? 'n/a'} |

Inventory collection (**${inv.document_count.toLocaleString()}** docs):

- \`quantity_on_hand\` missing: **${invWf.quantity_on_hand_missing.toLocaleString()}** (${pct(invWf.quantity_on_hand_missing, inv.document_count)}%)
- \`availability=nla\`: **${inv.availability_distribution.nla.toLocaleString()}** (no longer available — storefront semantics differ from qty=0)
- Unparseable price: **${invWf.price_unparseable.toLocaleString()}**

**Schema difficulty:** Shopware product stock is a scalar on the product entity; source splits sellable identity (\`products.source\`) from fulfillment identity (\`inventory.source\`). Multiple part SKUs can share one stock row (Confluence: brand-name variants). Empty stock on ~${pct(join.product_stock_empty, totalParts)}% of parts forces a policy default (zero vs skip) that affects salability and search facets.

---

## IPL / media / assets gap

- **${wf.photos_empty.toLocaleString()}** product docs have empty \`photos[]\` (${pct(wf.photos_empty, prod.document_count)}%).
- Parts with non-empty \`photos[]\` reference asset IDs, but **assets.bson is absent** in the sample archive (${assets.notes}).
- ${assets.metadata_stubs ?? 0} \`assets_staging_incremental_*.metadata.json\` stubs exist without BSON payload.

Confluence specifies IPL custom entity plugin and CDN-backed media. Without \`assets\` join path, **every part with photo refs blocks media resolution** — observed ~20% block rate on 10k-part transform sample when policy requires assets.

**Scale implication:** At ~5.1M product docs, even a minority with photos implies hundreds of thousands of media operations once assets exist — requiring idempotent Admin API media upserts and CDN URL contract from client.

---

## Brand / equipment type sparsity

- \`equipment_type\` empty on **${wf.equipment_type_empty.toLocaleString()}** docs (${pct(wf.equipment_type_empty, prod.document_count)}%).
- Brand family is often inferred, not normalized (overview § Brand Family).

Shopware category SEO and equipment-type landing pages (Confluence Brand Equipment Type Page) need stable category keys; sparse equipment metadata increases manual mapping or ML inference cost.

---

## Scale and migration throughput

| Collection | Documents | On-disk size |
|------------|----------:|-------------:|
| products | ${prod.document_count.toLocaleString()} | ${(p.extracted_bson_on_disk?.file_sizes_bytes?.products / 1e9).toFixed(2)} GB |
| inventory | ${inv.document_count.toLocaleString()} | ${(p.extracted_bson_on_disk?.file_sizes_bytes?.inventory / 1e9).toFixed(2)} GB |

A naïve full-document EventBridge payload at ~1KB/detail would exceed practical bus limits; compact ID-only events (Confluence EventBridge design) require fetch-on-process and idempotent upsert — mandatory at this scale.

---

## Client-only verdict

The BSON sample is sufficient to measure shape, cardinality, and join health for **parts + inventory**. It is **insufficient** to validate IPL diagram loading, media CDN resolution, or live change-stream behavior — those require \`assets.bson\`, Shopware staging credentials, and DocumentDB change stream access from the client environment.

`
}

function main () {
  const profile = loadProfile()
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true })
  fs.writeFileSync(OUT_MD, narrative(profile))
  console.log(`Wrote ${OUT_MD}`)
}

main()
