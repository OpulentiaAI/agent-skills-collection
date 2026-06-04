# PartsTree Catalog DB → Shopware migration blocker and strategy report

## Verdict

The migration delay is explained by evidence in the supplied data and plan. This is not a simple ETL. It is a multi-system migration from a flexible DocumentDB/Mongo catalog into Shopware’s product/category/custom-entity model with millions of records, unresolved mapping decisions, missing media/IPL source data, high-volume operational updates, and at-least-once eventing semantics.

## Local source profile

| Collection | Documents | Notes |
|---|---:|---|
| `products` | 5,142,183 | 4,759,440 parts; 382,743 models. |
| `inventory` | 3,626,867 | Stock/price/availability source. |
| `accounts` | 0 | Empty in supplied archive. |
| `assets` | missing | Required for media/IPL; only incremental metadata was present. |
| `attributes` | missing | Metadata was present; full BSON was absent. |

## Confirmed data-quality signals

| Signal | Observed value | Migration impact |
|---|---:|---|
| Products with missing/empty `stock` | 973,287 | Cannot directly join to inventory by `products.stock -> inventory.source`. |
| Products marked deleted | 438,979 | Deletion semantics must be explicit. |
| Products unapproved | 26,545 | Approval flag must gate publication. |
| `equipment_type` empty | 4,784,435 | Search/navigation assumptions cannot depend on this field. |
| Products with no photos | 3,538,347 | Media completeness is low; missing `assets.bson` blocks full media migration. |
| Inventory `quantity_on_hand` missing | 2,735,879 | Stock fallback contract is required. |
| Inventory `source_touch` missing | 3,340,167 | Freshness tracking cannot rely on this field for most rows. |
| Inventory price parse failures | 3,670 | Invalid prices need DQ/replay handling. |
| Inventory max price | 380,729.99 | Outlier validation is required. |

## Likely delay-causing blockers

### 1. Source-of-truth and access were not operationally settled

The plan requires moving a local Mongo catalog into AWS VPC while preserving `sync`, `review`, `approved`, and `deleted` workflow semantics. Any unstable source or approval workflow blocks every downstream migration phase.

### 2. Target data model was still being decided during implementation

The plan treats model/category/IPL mapping as WIP and introduces custom IPL entities, join tables, mock dependencies, and visibility flags. That is target architecture design, not mechanical data loading.

### 3. Source volume and sparsity exceeded simple planning assumptions

The actual `products` collection contains 5.14M rows and `inventory` contains 3.63M rows. Large sparse fields and many-to-one stock references require batch ledgers, normalization, and reconciliation.

### 4. Data quality was not a late-stage concern; it is the core migration problem

The plan’s later refactor proposal calls out complex aggregation pipelines, lack of domain models, hard-coded null coalescing, and no deduplication. The BSON profile confirms sparse and invalid fields at migration-scale.

### 5. Media/IPL execution is blocked by missing source data

The supplied archive does not include full `assets.bson` or full IPL source data. Media URL generation and IPL custom entity loading cannot be verified locally without it.

### 6. Ongoing sync requires idempotent event ledgers, not direct “push as-is” eventing

DocumentDB/Lambda change streams are at-least-once and can duplicate events. EventBridge and Lambda have payload/throughput limits. A collector/event-ledger pattern is safer than full-record event payloads.

### 7. Error handling needed durable queues and replay

CloudWatch logs alone are not a migration control plane. Failed rows/events need issue type, source key, target entity, payload hash, retry count, error, and replay command.

### 8. Custom fields and plugins must be target-contract gates

The plan includes dev/staging differences and unresolved custom-field notes. Loader agents must not begin until Shopware schema parity is verified.

## Optimal strategy

1. Freeze access and source scope.
2. Profile the complete source.
3. Freeze mapping contract.
4. Verify Shopware target contract.
5. Generate dry-run payloads and DQ queues.
6. Load dev in dependency order.
7. Independently reconcile target reads.
8. Repeat in staging/prod with the same scripts and manifests.
9. Enable ongoing sync only after duplicate/replay/reconciliation tests pass.

## Local dry-run loadability summary

| Group | Candidate rows | Blocked rows | Locally loadable rows |
|---|---:|---:|---:|
| Parts → Shopware products | 4,759,440 | 323,782 | 4,435,658 |
| Models → categories | 382,743 | 141,758 | 240,985 |
| Inventory → stock/price | 3,626,867 | 3,718 | 3,623,149 |
| Media → Shopware media | 0 | 1 | 0 |
| IPLs → custom entity | 0 | 1 | 0 |

Media and IPL rows show zero candidates because the full source collections were not present in the local archive.
