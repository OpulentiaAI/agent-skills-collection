# DeepWiki target ideal — Shopware 6 migration patterns

**Research method:** DeepWiki subagent (2026-06-02) + official Shopware/AWS documentation.

**Scope:** Production-grade design for Catalog DB (Mongo/DocumentDB) → Shopware 6 baseline load and ongoing sync.

---

## Executive summary

| Layer | Production recommendation |
|-------|---------------------------|
| **Baseline load** | OAuth integration → dependency-ordered loaders → `POST /api/_action/sync` with `indexing-behavior: use-queue-indexing`, deterministic Shopware UUIDs from stable source keys, per-batch hash ledgers + independent reconciliation |
| **Target model** | **Categories** for Brand/Model navigation; **custom entity `ipl`** + M:N joins for diagrams; **custom fields** for scalar PT metadata and CDN URLs |
| **Ongoing sync** | DocumentDB change stream → **compact events** (source ID + correlation ID) → **DynamoDB ledger** → same normalization as baseline; EventBridge for routing only; processors **fetch authoritative state** from DocumentDB |
| **Idempotency** | Natural key = `products.source` / `inventory.source`; Shopware upsert by stable `id` + `productNumber`; event dedupe = `pk=SOURCE#{collection}#{sourceId}` + `sk=EVENT#{correlationId}` |

---

## Shopware Admin API

### Write path: Sync API

```json
{
  "write-parts-batch-001": {
    "entity": "product",
    "action": "upsert",
    "payload": [{ "id": "<deterministic-uuid>", "productNumber": "...", "customFields": {} }]
  }
}
```

| Header | When to use |
|--------|-------------|
| `indexing-behavior: use-queue-indexing` | **Default for migration** — defer indexers to queue |
| `indexing-behavior: disable-indexing` | Only after smoke + planned reindex |
| `indexing-skip: product.search-keyword` | Bulk load when search keywords not needed yet |
| `fail-on-error: true` | Staging batches where partial success is unacceptable |
| `fail-on-error: false` | Large prod batches with per-row error ledger |
| `single-operation: true` | Debugging association failures |

**Upsert rule:** Always send stable payload `id` (32-char hex UUID). Without it, retries create duplicate products at 4.4M+ scale.

| Entity | Pattern | PTREE notes |
|--------|---------|-------------|
| Manufacturer / brand | Sync `product_manufacturer` upsert | Before categories/products |
| Category (model tree) | Sync `category` with `parentId` | Topological: brand → family → model → variant |
| Product (parts) | Sync `product` upsert | `productNumber` = source SKU; map `meta.*` → `active` + visibility |
| Custom fields | `customFields` on entity | Scalar PT attrs; prefix `custom_` per Confluence |
| Custom entity `ipl` | Plugin entity + join tables | M:N model↔IPL and part↔IPL; not JSON blobs on product |
| Media | `media` + `product_media` | CDN URL + media path ADR; avoid CDN-only parallel catalog |
| Stock | `product.stock` / Multi-Inventory API | 973K empty `products.stock` — join/fallback policy required |

**Reconciliation (non-negotiable):** Loaders must not self-certify. Independent agent searches by custom-field source ID, compares payload hash from ledger vs read-back JSON.

### Custom entity vs custom field (IPL / parts)

| Data | Construct | Rationale |
|------|-----------|-----------|
| Brand / model navigation | **Category tree** + scalar custom fields | Native SEO paths, Store API |
| IPL diagram record | **Custom entity `ipl`** (PartsTreeIplPlugin) | Hotspots, SVG/raster refs, M:N associations |
| IPL ↔ model / part | **Join entities** `ipl_model`, `ipl_product` | Queryable; not invisible JSON |
| Part SKU, availability, CDN URL | **Custom fields** on `product` | Scalar, searchable |
| 355K `ipl[]` without `assets.bson` | **Block loader** | Not a reason to stuff IPL into custom fields |

**Recommended hybrid:**

```text
Category (brand → model → variant)
  ↕ custom field source IDs
Custom entity ipl
  ↔ ipl_model ↔ model refs
  ↔ ipl_product ↔ part product
Product (part) + custom_fields (scalar PT attributes)
Media via Shopware media + CDN custom field
```

---

## Catalog migration patterns

```text
Phase 1: Tax / currency / sales channel / manufacturers
Phase 2: Category tree (models — blocked until Confluence Option 1/2)
Phase 3: IPL custom entity + joins (requires assets.bson)
Phase 4: Parts — product upsert + stock + customFields
Phase 5: Media associations (async from assets)
Phase 6: Inventory deltas
```

| Concern | Pattern |
|---------|---------|
| Stable identity | `products.source` → deterministic Shopware `id` + `productNumber` |
| Deletes | Explicit `action: delete` or `active: false` — do not omit silently |
| Batch ledger | JSONL: `source_id`, `target_id`, `payload_hash`, `status`, `replay_token` |
| Batch size | Start 50–200 products/batch; tune by latency and 429 rate |
| Concurrency | 1–3 workers per entity type; categories before products |
| Backpressure | Exponential backoff on 429/503; never unbounded retry storm |

---

## Event-driven sync

**Compact event contract** (`compact-sync-event.schema.json`): `eventVersion`, `eventType`, `correlationId`, `sourceCollection`, `sourceId`, `changeType`, `emittedAt` — optional `workflowHint`, `documentKey._id`, `changeStreamToken`. **Max ~12 properties; no embedded documents.**

**Flow:**

```text
DocumentDB change stream
  → collector (compact event only + checkpoint)
  → DynamoDB ledger (PENDING → COMPLETED | FAILED)
  → processor (fetch full doc from DocumentDB)
  → normalize → Sync API upsert
  → optional EventBridge fan-out (routing only)
  → daily reconciler
```

| Layer | Key | Behavior |
|-------|-----|----------|
| Ledger PK | `SOURCE#{collection}#{sourceId}` | One logical source row |
| Ledger SK | `EVENT#{correlationId}` | At-least-once dedupe; skip if `COMPLETED` |
| Payload hash | `sha256(compact JSON)` | Detect duplicate emissions |
| Processor | Upsert by stable `id` | Safe on duplicate delivery |
| Replay | `--replay collection:sourceId` | Re-fetch + re-normalize |

**EventBridge role:** Route by `detail-type` to processors; detail < 256 KB; DLQ on failure. **Not** a durable changelog — state lives in DynamoDB ledger + DocumentDB.

---

## DocumentDB change streams vs EventBridge

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Explicit enable per collection | Must enable on `products`, `inventory`, `assets` | Pre-sync checklist |
| Retention 3h default, 7d max | Extended outage → full reconcile | Persist resume token (DynamoDB/SSM) |
| **16 MB max event size** | Large docs with `ipl[]`, `photos[]` fail on `fullDocument` | `updateDescription` + keyed fetch |
| **Lambda payload ≤ 6 MB** | Oversized records dropped | Compact events only |
| At-least-once delivery | Duplicate processing | Idempotent Shopware upsert + ledger |
| No oplog | Cannot tail classic Mongo oplog | Change stream + checkpoint collection |
| Unsupported aggregations (`$facet`, etc.) | Enrichment failures | Precomputed fields or offline enrich |

**Design rule:** Change stream = **notification**, not **payload transport**. Aligns with compact-event schema and Confluence EventBridge design.

---

## Anti-patterns

| Anti-pattern | Alternative |
|--------------|-------------|
| Full-document events on EventBridge/Lambda | Compact event + DocumentDB fetch |
| `fullDocument: updateLookup` on large products | `updateDescription` + keyed fetch |
| Per-row REST POST without Sync API | `/api/_action/sync` batched upserts |
| Synchronous indexing during bulk | `use-queue-indexing` |
| Upsert without stable Shopware `id` | UUID from `products.source` |
| Loader self-certification | Independent reconciliation agent |
| Assuming top-level `sync` flag (BSON uses `meta.*`) | Explicit workflow mapping in normalize layer |
| Loading deleted/unapproved without policy | Publication gate in mapper |
| IPL/media loader without `assets.bson` | Block until assets export delivered |
| IPL as custom fields only at 355K+ scale | Custom entity + join tables |
| EventBridge as system of record | DynamoDB ledger + checkpoints |

---

## PTREE production checklist

- [ ] Confluence Option 1/2: models → categories (blocks ~84% of sample models while undecided)
- [ ] `assets.bson` for IPL/media join
- [ ] CDN base URL + media resolution contract
- [ ] Shopware OAuth + currency UUID (**credentials**)
- [ ] DocumentDB change stream IAM + VPC (**credentials**)
- [ ] Publication policy for 438,979 soft-deleted products
- [ ] NLA availability mapping (`nla` vs `ava` vs missing qty)
- [ ] Deterministic UUID mapping table (`source` → Shopware `id`)
- [ ] Sync API batch smoke on target env (limits unverified until live test)

---

## Official documentation index

| Area | URL |
|------|-----|
| Shopware Admin API | https://developer.shopware.com/docs/concepts/api/admin-api.html |
| Sync API / indexing | https://docs.shopware.com/en/shopware-platform-dev-en/admin-api-guide/sync-api |
| Catalog Import ADR | https://developer.shopware.com/docs/v6.5/resources/references/adr/2023-09-22-catalog-import-api.html |
| Custom fields | https://developer.shopware.com/docs/guides/plugins/plugins/framework/custom-field/ |
| Custom entities | https://developer.shopware.com/docs/guides/plugins/plugins/framework/custom-entity/ |
| Media path ADR | https://developer.shopware.com/docs/resources/references/adr/2023-08-17-media-path.html |
| DocumentDB change streams | https://docs.aws.amazon.com/documentdb/latest/developerguide/change_streams.html |
| DocumentDB + Lambda | https://docs.aws.amazon.com/documentdb/latest/devguide/using-lambda.html |
| EventBridge PutEvents | https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutEvents.html |

**Workspace artifacts:** `compact-sync-event.schema.json`, `config/target-mapping-policy.json`, `infrastructure/eventbridge/template.yaml`, `scripts/simulate_eventbridge.mjs`.

*Merged from DeepWiki subagent research + assessment pipeline artifacts. 2026-06-02.*
