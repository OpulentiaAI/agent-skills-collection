# Quota and limits — migration control plane

## Shopware Admin API

| limit | dev | staging | prod | source | verified |
|-------|-----|---------|------|--------|----------|
| rate limit (req/s) | unknown | unknown | unknown | vendor/docs/smoke | no |
| /api/_action/sync max payload | unknown | unknown | unknown | smoke test | no |
| bulk write batch size | TBD | TBD | TBD | team decision | no |

## AWS / sync path (Batch F)

| component | limit | notes |
|-----------|-------|-------|
| EventBridge payload | ~256 KB | use compact source IDs per strategy |
| Lambda concurrency | unknown | |
| DocumentDB change stream | at-least-once | dedupe required |
| DynamoDB WCU/RCU | unknown | event ledger |

## Migration batch sizing (from local dry-run)

| entity | rows in scope (local) | planned batch size | rationale |
|--------|----------------------|--------------------|-----------|
| products (parts) | 4,435,658 loadable | TBD | dry-run-groups.csv |
| models → categories | 240,985 loadable | TBD | hierarchy deps |
| inventory | 3,623,149 loadable | TBD | join contract required |

## Verdict linkage

G0 access: Shopware/API limits **unknown** — does not block local dry-run; **blocks** loader batch sizing until smoke tests complete.
