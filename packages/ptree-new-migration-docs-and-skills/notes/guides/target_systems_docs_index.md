# Target systems documentation index — PartsTree → Shopware migration

Generated: 2026-06-02. Authoritative migration control plane remains in `ptree-new-migration-docs-and-skills/`. This index links **official/vendor** docs plus **project intent** sources used to define target-side integration contracts.

## Systems inventory (inferred)

| System | Role in migration | Environments (expected) | Project refs |
|--------|-------------------|-------------------------|--------------|
| **Shopware 6** | Target commerce DB: products, categories, manufacturers, media, custom fields, IPL custom entity plugin | dev, staging, prod | `environment_matrix.csv`, Confluence PDF, `agent/orchestration/workflow.md` |
| **AWS DocumentDB** | Source-of-truth catalog (Mongo-compatible); change streams for ongoing sync | dev, staging, prod (VPC) | Confluence PDF, `access_matrix.csv`, Phase 7 strategy |
| **AWS S3** | Asset/media object storage; IPL image checksum URLs | staging, prod | Confluence CDN section, `access_matrix.csv` |
| **CDN / CloudFront** | Public media URL resolution (reuse existing PartsTree CDN per Confluence) | prod (+ staging if mirrored) | Confluence p.59, `access_matrix.csv` |
| **AWS EventBridge** | Sync event bus: DocumentDB/API changes → Lambda processors | sync | Confluence EventBridge design, Batch F |
| **AWS Lambda** | Entity sync processors (Model, Part, IPL) + load path | sync | Confluence sync Lambdas, Batch F |
| **AWS DynamoDB** | Compact event ledger (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED`) | sync | `agent/orchestration/workflow.md` (sync phase) |
| **AWS ECS** | .NET change-stream consumer (DocumentDB → EventBridge) | sync | Confluence change-stream consumer design |
| **AWS Secrets Manager / SSM** | Shopware OAuth, DocumentDB URI, API keys | all | `secrets_readiness.md` |
| **AWS IAM** | Producer/consumer roles for EventBridge, Lambda, S3, DocumentDB | all | Confluence IAM tasks, Batch F |
| **Shopware Store API / Headless Frontends** | Read-side validation of loaded catalog (not write target) | dev, staging, prod | Confluence headless storefront section |
| **Jira / Figma / Confluence** | Planning evidence and open decisions (not runtime targets) | org | `access_matrix.csv`, `evidence_index.md` |

---

## Official / vendor documentation

### Shopware 6

| Doc | URL | Relevance |
|-----|-----|-----------|
| Admin API overview | https://developer.shopware.com/docs/concepts/api/admin-api.html | CRUD + integration surface for all baseline migration loaders (Batch D). |
| Admin API reference (Stoplight) | https://shopware.stoplight.io/docs/admin-api/ | Endpoint schemas for product, category, manufacturer, media, custom fields. |
| Sync API (`POST /api/_action/sync`) | https://developer.shopware.com/docs/guides/plugins/apps/app-sdks/javascript/05-http-client.html | Bulk upsert/delete for ~4.4M parts + 241K categories; indexing-behavior headers for throughput. |
| Create product + category flow | https://developer.shopware.com/docs/guides/development/integrations-api/flows/create-product.html | Dependency order: tax, sales channel, category, product, visibilities. |
| Custom fields guide | https://developer.shopware.com/docs/guides/plugins/plugins/framework/custom-field/ | ~30+ PT custom fields on model/part/category (Confluence p.61–65); G3 parity gate. |
| Custom entities | https://developer.shopware.com/docs/guides/plugins/plugins/framework/custom-entity/ | IPL custom entity + join tables (`ipl_model`, `ipl_product`) per Confluence plugin design. |
| Plugin overview (upgrade-safe extensions) | https://developer.shopware.com/docs/guides/plugins/overview.html | IPL plugin must not break Shopware upgrade path (Confluence requirement). |
| Catalog Import API ADR | https://developer.shopware.com/docs/v6.5/resources/references/adr/2023-09-22-catalog-import-api.html | Alternative bulk path: products with category paths, remote media URLs, custom entities under `extensions`. |
| Media path / external CDN ADR | https://developer.shopware.com/docs/resources/references/adr/2023-08-17-media-path.html | Media should flow through Shopware stack or set path explicitly; blocks naive S3-only upload. |
| Multi-inventory Admin API | https://developer.shopware.com/docs/v6.6/guides/plugins/plugins/api/multi-inventory.html | If stock maps to warehouse groups vs simple `product.stock`. |
| SaaS rate limits | https://docs.shopware.com/en/en/shopware-6-en/saas/rate-limits | OAuth/indexing throttles; self-hosted may differ — smoke test required (`quota_limits.md`). |

### AWS DocumentDB

| Doc | URL | Relevance |
|-----|-----|-----------|
| Supported MongoDB APIs | https://docs.aws.amazon.com/documentdb/latest/developerguide/mongo-apis.html | Compatibility matrix for aggregation, change streams, GridFS; `$facet` not supported on 3.6–5.0. |
| Functional differences vs MongoDB | https://docs.aws.amazon.com/documentdb/latest/developerguide/functional-differences.html | Source pipeline refactors if legacy cataloger uses unsupported operators. |
| Change streams | https://docs.aws.amazon.com/documentdb/latest/devguide/change_streams.html | Batch F trigger: 3h default retention (7d max), 16 MB event cap, at-least-once, explicit enable per collection. |
| Change streams on reader instances (5.0+) | https://aws.amazon.com/about-aws/whats-new/2024/07/amazon-documentdb-change-streams-reader-instances/ | Offload change-stream consumer from primary during baseline + sync. |

### AWS media / CDN / object storage

| Doc | URL | Relevance |
|-----|-----|-----------|
| CloudFront + S3 OAC | https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html | Secure CDN origin for IPL/part images; OAC preferred over legacy OAI. |
| CloudFront OAC announcement | https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-introduces-origin-access-control-oac/ | SSE-KMS, SigV4 signing for private buckets. |
| S3 bucket policies | https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html | Restrict direct S3 access; CloudFront-only reads for prod media. |

### AWS sync / eventing (Batch F)

| Doc | URL | Relevance |
|-----|-----|-----------|
| EventBridge PutEvents | https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-putevents.html | Max ~1 MB/request (2026); prefer compact source-ID events per migration strategy. |
| EventBridge API PutEvents | https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_PutEvents.html | Batch up to 10 entries; store large payloads in S3 and pass URL if needed. |
| Lambda async payload limits | https://aws.amazon.com/blogs/compute/more-room-to-build-serverless-services-now-support-payloads-up-to-1-mb/ | Sync processors must not embed full catalog documents. |
| DynamoDB developer guide | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html | Event ledger table design for idempotent sync state machine. |
| Secrets Manager | https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html | Store `SHOPWARE_*`, `DOCUMENTDB_URI` for Lambda/ECS runners. |
| Systems Manager Parameter Store | https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html | Confluence change-stream consumer uses SSM for config. |

---

## Project intent & target architecture (internal)

| Doc | Path | Relevance |
|-----|------|-----------|
| Confluence export (target architecture SSOT) | `agent-skills-collection/docs/Confluence-PTREE-010626-130110.pdf` | Models/IPLs as categories, IPL custom entity plugin, custom field list, EventBridge sync, CDN reuse, mock dependency pattern. |
| Catalog → Shopware overview | `agent-skills-collection/docs/input-sample-data.zip` → `Opulent/partstree_catalog_shopware_overview.md` | Brand→Model→IPL→Parts hierarchy and ingestion mapping intent. |
| Agent workflow | `NewDiscoveriesandPlans/.../agent/orchestration/workflow.md` | Target contract, sync phase, loader order. |
| Access / environment matrices | `NewDiscoveriesandPlans/.../access_matrix.csv`, `environment_matrix.csv` | Required services and credential status (currently mostly unknown/deferred). |
| Verification gates G0–G8 | `NewDiscoveriesandPlans/.../verification-gates.csv` | Which target artifacts must exist before loaders/sync. |
| Agent workstream matrix | `NewDiscoveriesandPlans/.../agent-workstream-matrix.csv` | Maps target blockers to Batch A–F agent roles. |
| Blocker strategy report | `NewDiscoveriesandPlans/.../blocker-strategy-report.md` | Evidence-backed source/target delay causes. |
| Secrets readiness | `NewDiscoveriesandPlans/.../secrets_readiness.md` | Generic secret names; no values stored. |
| Quota limits (partial) | `NewDiscoveriesandPlans/.../quota_limits.md` | Shopware sync sizing + EventBridge payload guidance. |
| Open decisions | `NewDiscoveriesandPlans/.../open_decisions.tsv` | Unresolved target-model choices blocking G2/G3. |

---

## Required credentials / env vars (generic — no secrets)

| Variable / credential | System | Used by | Gate |
|----------------------|--------|---------|------|
| `SHOPWARE_BASE_URL` | Shopware | Admin API smoke, loaders, reconciliation | G3, G5+ |
| `SHOPWARE_ADMIN_CLIENT_ID` | Shopware OAuth | Token exchange | G3, G5+ |
| `SHOPWARE_ADMIN_CLIENT_SECRET` | Shopware OAuth | Token exchange | G3, G5+ |
| `SHOPWARE_API_VERSION` / version probe | Shopware | Schema snapshot drift check | G3 |
| `DOCUMENTDB_URI` | DocumentDB | Live source profile, change streams, daily reconciliation | G0, G1, G8 |
| `AWS_REGION` | AWS | All AWS services | G0 |
| `AWS_ACCESS_KEY_ID` / role assumption | AWS IAM | CI runners, Lambda, ECS (prefer IAM roles) | G0, F |
| `S3_MEDIA_BUCKET` | S3 | Media URL resolution, asset verification | G0, Batch B4 |
| `CDN_BASE_URL` | CloudFront/CDN | Media/IPL URL contract | G0, Batch B4 |
| `EVENTBRIDGE_BUS_ARN` | EventBridge | Sync publish/subscribe | G8 |
| `DYNAMODB_EVENT_LEDGER_TABLE` | DynamoDB | Idempotent sync ledger | G8 |
| `LAMBDA_SYNC_*` execution roles | Lambda/IAM | Model/Part/IPL processors | G8 |

Store in Secrets Manager or SSM; never commit values. See `secrets_readiness.md`.
