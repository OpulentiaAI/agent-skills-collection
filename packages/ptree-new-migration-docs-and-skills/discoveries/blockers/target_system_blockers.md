# Target system integration blockers — PartsTree → Shopware migration

Generated: 2026-06-02. Cross-referenced to `agent-workstream-matrix.csv` (Batch A–F) and gates G0–G8.

**Priority key:** P0 = blocks gate or loader track; P1 = high risk of rework/delay if unresolved before Batch D/F.

---

## Summary: top target-side blockers

### P0

| ID | System | Blocker | Gate | Primary agent(s) |
|----|--------|---------|------|------------------|
| TB-01 | All targets | `environment_matrix.csv` and live endpoints unset; no dev/staging/prod URLs, accounts, or Shopware versions | G0 | Access/Infra (A) |
| TB-02 | Shopware + AWS | No OAuth/API/IAM credentials in workspace; human deferral on live access | G0, G3, G5+ | Access/Infra (A), Target Shopware (A) |
| TB-03 | Shopware | Target schema snapshot, custom-field diff, plugin health, API smoke artifacts **missing** | G3 | Target Shopware (A), Target Schema Contract (B) |
| TB-04 | Shopware | Custom fields + IPL plugin dev/staging/prod parity unverified (Confluence lists fields missing on dev) | G3 | Target Schema Contract (B), Mapping Contract (B) |
| TB-05 | Shopware | Model→category vs custom-entity mapping **undecided** (141K+ model rows blocked in dry-run) | G2, G3 | Mapping Contract (B), Target Schema Contract (B) |
| TB-06 | Shopware + S3/CDN | Media/IPL load groups at **0 loadable**; full `assets.bson` absent; CDN URL contract not validated | G0, G1, G4 | Media/IPL Contract (B), Media/IPL Loader (D) |
| TB-07 | Shopware | IPL custom entity plugin + join tables (`ipl`, `ipl_model`, `ipl_product`) not externally smoke-tested | G3, G4 | Target Shopware (A), Media/IPL Contract (B) |

### P1

| ID | System | Blocker | Gate | Primary agent(s) |
|----|--------|---------|------|------------------|
| TB-08 | Shopware | Admin API rate limits and `/api/_action/sync` batch sizing **unknown** for 4.4M+ products | G3, G5 | Access/Infra (A), Batch Manifest (C) |
| TB-09 | Shopware | Media path: external CDN vs Shopware media manager (ADR: uploads should go through Shopware or explicit path) | G3, B4 | Media/IPL Contract (B) |
| TB-10 | DocumentDB | Change streams: 3h default retention, 16 MB event max, at-least-once duplicates | G8 | Event Contract (F), Sync Processor (F) |
| TB-11 | EventBridge/Lambda | Full-record events rejected by design; compact ID-only contract not implemented | G8 | Event Contract (F) |
| TB-12 | DocumentDB | Legacy cataloger may use `$facet`, correlated `$lookup`, collation — unsupported on DocumentDB 5.0 | G1, G8 | Source Profile (B), Sync Processor (F) |
| TB-13 | Shopware | Mock dependency + `visible=false` sync semantics must match plugin (Confluence IPL/Model/Part Lambdas) | G5, G8 | Loaders (D), Sync Processor (F) |
| TB-14 | Shopware | Publication semantics for deleted (439K) and unapproved (26K) rows not frozen | G2, G4 | Mapping Contract (B), Normalization (C) |
| TB-15 | Shopware | Stock join fallback for 973K products with empty `products.stock` | G2, G4 | Mapping Contract (B), Inventory Loader (D) |

---

## Full blocker register

| System | Blocker | Likelihood | Mitigation | Gate | Required access | Batch / agent |
|--------|---------|------------|------------|------|-----------------|---------------|
| **Shopware 6** | Target environments not configured (`environment_matrix.csv` empty) | **Certain** | Human fills matrix; Access/Infra verifies reachability | G0 | `SHOPWARE_BASE_URL` per env | A — Access/Infra |
| **Shopware 6** | Admin OAuth credentials absent | **Certain** | Provision integration client; store in Secrets Manager; smoke token exchange | G0, G3 | `SHOPWARE_ADMIN_CLIENT_ID`, `SHOPWARE_ADMIN_CLIENT_SECRET` | A — Access/Infra, Target Shopware |
| **Shopware 6** | Schema/plugin contract not proven (`shopware_schema_snapshot.json` missing) | **Certain** | Target Shopware Agent: read schema, diff custom fields, plugin health, write smoke JSON | G3 | Admin API read + test write in dev | A — Target Shopware; B — Target Schema Contract |
| **Shopware 6** | Custom field parity dev/staging/prod (OD-11; Confluence notes fields missing on dev) | **High** | Export custom field sets per env; `custom_field_diff.csv`; human approval | G3 | Admin API + admin UI read | B — Target Schema Contract |
| **Shopware 6** | IPL plugin (`PartsTreeIplPlugin`) not verified on target envs | **High** | Install/activate; CRUD smoke on `/api/search/ipl`; mock resolution test | G3 | Admin API + plugin deploy access | A — Target Shopware; B — Target Schema Contract |
| **Shopware 6** | Model mapping undecided: category vs custom entity (OD-01; 141K blocked models) | **High** | Freeze mapping contract row; Confluence Option 1 vs 2 decision | G2, G3 | Domain owner + Admin API write smoke | B — Mapping Contract, Target Schema Contract |
| **Shopware 6** | Category tree depth/volume (~241K loadable models + IPL categories) may hit API/indexing limits | **Medium** | Sync API with `indexing-behavior: use-queue-indexing`; batch manifest sizing | G3, G5 | Admin API; monitor indexing queue | C — Batch Manifest; D — Category/Model Loader |
| **Shopware 6** | Sync API throughput unknown for 4.4M parts | **High** | Smoke test payload sizes; record limits in `quota_limits.md`; deterministic batch size | G3, G5 | Dev Shopware + load test principal | A — Access/Infra; C — Batch Manifest |
| **Shopware 6** | Rate limits on OAuth/indexing endpoints (429 + Retry-After) | **Medium** | Token reuse; backoff; avoid `/api/_action/index` during bulk load | G5 | Admin API | D — all loaders |
| **Shopware 6** | External/idempotency fields for source `products.source` not confirmed writable | **Medium** | Map to `productNumber` + custom field; verify upsert by ID in smoke | G3 | Admin API write | B — Mapping Contract; D — Product Loader |
| **Shopware 6** | Deleted/unapproved publication semantics undefined (439K / 26K) | **High** | Mapping rows for `active`, visibility, custom flags | G2, G4 | Admin API + business rules | B — Mapping Contract; C — Normalization |
| **Shopware 6** | Inventory/stock mapping: empty stock refs (973K), missing `quantity_on_hand` (2.74M) | **High** | Freeze stock fallback + DQ rules before inventory loader | G2, G4 | Admin API + source join proof | B — Mapping; D — Inventory Loader |
| **Shopware 6** | Price parse failures (3,670) and outliers (max 380K) | **Medium** | Validation + reject/review queue | G2, G4 | Admin API price write | B — Mapping; C — DQ Queue |
| **Shopware 6** | Media association blocked: 3.5M products without photos; assets collection missing | **Certain** (local) | Obtain full `assets.bson`; CDN resolution report | G0, G1, G4 | S3/CDN read + Admin media API | A — Source Snapshot; B — Media/IPL Contract; D — Media/IPL Loader |
| **Shopware 6** | CDN URL strategy vs Shopware media entity paths (Confluence: reuse PT CDN, not new CDN) | **High** | `cdn_resolution_report.csv`; align `custom_images_cdn_url` / IPL `cdn_url` | G3, B4 | CDN base URL + Admin API | B — Media/IPL Contract |
| **Shopware 6** | Manual admin uploads need same CDN path (PAR-423, open in Confluence) | **Medium** | Separate media upload path or post-upload URL rewrite | G3+ | Admin UI + S3/CDN write | Post-MVP / human |
| **Shopware 6** | Dev/staging/prod drift during staged loads (Batch E) | **Medium** | Same scripts/manifests; schema snapshot per env before E | G6, G7 | Staging + prod Admin API | E — Staging/Prod Load & Verification |
| **AWS DocumentDB** | Live cluster access deferred; local BSON sample only | **Certain** (workspace) | Approved deferral or VPN/bastion read-only URI | G0, G1 | `DOCUMENTDB_URI`, VPC peering | A — Access/Infra, Source Snapshot |
| **AWS DocumentDB** | Change streams must be enabled per collection | **High** | Explicit enable on `products`, `inventory`, `assets` before Batch F | G8 | DocumentDB admin + app role | F — Event Contract |
| **AWS DocumentDB** | Change stream retention default 3h (max 7d) — consumer lag risk | **Medium** | Increase `change_stream_log_retention_duration`; monitor lag | G8 | DocumentDB parameter group | F — Sync Processor |
| **AWS DocumentDB** | At-least-once delivery → duplicate sync events | **High** | DynamoDB ledger + idempotent upsert by source key | G8 | DocumentDB + DynamoDB | F — Event Contract, Sync Processor, DLQ/Replay |
| **AWS DocumentDB** | 16 MB max change event size | **Low–Medium** | Emit compact events (IDs only); avoid full-document stream payloads | G8 | Change stream consumer | F — Event Contract |
| **AWS DocumentDB** | Unsupported aggregation (`$facet`, correlated `$lookup`, collation) in legacy pipelines | **Medium** | Refactor profiling/sync queries per AWS compatibility matrix | G1, G8 | DocumentDB read | B — Source Profile; F — Sync Processor |
| **AWS DocumentDB** | No MongoDB oplog — tooling expecting oplog will fail | **Low** | Use change streams only | G8 | DocumentDB | F — Event Contract |
| **AWS S3** | Bucket/prefix for media unknown in workspace | **High** | Fill `environment_matrix.csv`; list/read smoke | G0 | `S3_MEDIA_BUCKET`, IAM list/get | A — Access/Infra; B — Media/IPL Contract |
| **CDN / CloudFront** | `cdn_base` unknown; URL resolve not verified | **High** | HEAD/GET sample assets; map to Shopware custom fields | G0 | CDN read URL | A — Access/Infra; B — Media/IPL Contract |
| **CDN / CloudFront** | OAC/bucket policy may block migration runner direct S3 reads | **Medium** | Use CloudFront URLs for verification; IAM for batch copy if needed | G0 | CloudFront + S3 IAM | A — Access/Infra |
| **AWS EventBridge** | Bus/rules/ARNs unknown | **High** | Infrastructure discovery; document compact event schema | G8 | `EVENTBRIDGE_BUS_ARN`, publish/subscribe IAM | F — Event Contract |
| **AWS EventBridge** | Payload size/cost if sending large events | **Medium** | Source ID + correlation ID only (strategy Phase 7) | G8 | EventBridge publish | F — Event Contract |
| **AWS Lambda** | Sync functions (Model/Part/IPL) exist in design but not verified in env | **High** | Deploy dev; duplicate-event test | G8 | Lambda invoke + Secrets Manager | F — Sync Processor |
| **AWS Lambda** | Mock dependency replacement logic must match baseline loaders | **Medium** | Shared normalization code path; replay tests | G5, G8 | Lambda + Shopware | D — Loaders; F — Sync Processor |
| **AWS DynamoDB** | Event ledger table not provisioned | **High** | Create table with PK=source key, status, payload hash | G8 | DynamoDB read/write IAM | F — Event Contract, Daily Reconciliation |
| **AWS ECS** | Change-stream consumer (.NET) not verified | **Medium** | ECS deploy smoke; DocumentDB→EventBridge path | G8 | ECS task role, SSM, DocumentDB | F — Event Contract |
| **AWS IAM / Secrets** | Roles for producer/consumer/DLQ not documented in workspace | **High** | IAM policy review per Confluence tasks | G0, G8 | AWS org admin | A — Access/Infra; F — all |
| **Shopware Store API** | Storefront read patterns depend on category tags/IPL filters — not validated post-load | **Medium** | Staging verification samples per Confluence Store API examples | G6 | Store API read | E — Staging Verification |
| **Planning tools** | Jira/Figma deferred (optional G0) | **Low** | Human provides links if needed for OD closure | G0 | Jira/Figma read | A — Project Evidence |

---

## Human / credential blockers (action required)

These cannot be cleared by agents without human provisioning:

1. **Shopware Admin API OAuth client** (dev, staging, prod) — blocks G3 and all Batch D/E loaders.
2. **Environment matrix population** — base URLs, Shopware version, AWS account/region, S3 bucket, CDN base per env.
3. **DocumentDB read-only URI** (VPC) — blocks live source profile and Batch F change-stream path (currently deferred to local BSON).
4. **Full `assets.bson` / IPL source export** — blocks media/IPL target contract and loaders (Human Migration Lead deferral).
5. **Domain decisions** — model/category mapping (OD-01), IPL policy (OD-02), publication gating (OD-06), custom field parity sign-off (OD-11).
6. **AWS sync infrastructure** — EventBridge bus, Lambda ARNs, DynamoDB table, IAM roles for Batch F (post-baseline).
7. **Staging → prod cutover approval** — human gate G7 (OD-15).

---

## Agent ↔ blocker mapping (Batch A–F)

| Batch | Agent | Target systems touched | Key blockers owned |
|-------|-------|------------------------|------------------|
| **A** | Access/Infra | AWS, DocumentDB, Shopware, S3, CDN, secrets | TB-01, TB-02, S3/CDN unknowns |
| **A** | Target Shopware | Shopware Admin API, plugins, custom fields | TB-03, TB-04, TB-07, TB-08 |
| **A** | Source Snapshot | DocumentDB (manifest) | TB-06 source side; deferrals |
| **A** | Project Evidence | Confluence/Jira/Figma | Planning context for OD-01–11 |
| **B** | Mapping Contract | Shopware payload paths | TB-05, TB-14, TB-15 |
| **B** | Target Schema Contract | Shopware schema/plugins/custom fields | TB-03, TB-04, TB-07 |
| **B** | Media/IPL Contract | Shopware + S3 + CDN | TB-06, TB-09, TB-10 (CDN) |
| **C** | Batch Manifest / Normalization / DQ | Shopware (dry-run only) | TB-08 batch sizing, TB-14, TB-15 |
| **D** | Loaders (Brand→Category→Product→Inventory→Media/IPL) | Shopware write path | TB-05–09, TB-13–15 |
| **D** | Reconciliation | Shopware read-back | TB-03 smoke parity |
| **E** | Staging/Prod load + verification | Shopware staging/prod | TB-01, TB-02, dev/staging drift |
| **F** | Event Contract / Sync / DLQ / Daily recon | DocumentDB, EventBridge, Lambda, DynamoDB | TB-10–12, TB-11, infrastructure unknowns |

---

## Non-negotiable gate alignment

| Gate | Target-side pass condition | Current status |
|------|---------------------------|----------------|
| **G0** | Access matrix ready or deferred with owner | NOT_VERIFIED — most services `unknown`/`deferred` |
| **G3** | Every approved mapping target path writable on Shopware | NOT_VERIFIED — schema/smoke artifacts missing |
| **G5** | Dev load reconciles to payload hashes | BLOCKED — G0/G3/G4 |
| **G6–G7** | Staging/prod parity | BLOCKED — env matrix empty |
| **G8** | Duplicate/replay/daily recon pass | BLOCKED — sync infra + contract not built |

Run gate checker: `node agent/scripts/verify-gates.mjs`
