# EventBridge compact sync — assessment artifact

## Deployable (requires AWS)

`template.yaml` defines SAM/CloudFormation resources:

- Event bus `ptree-catalog-sync-{env}`
- Rules for five Confluence event types (model, part, inventory, IPL, media)
- SQS dead-letter queue placeholder
- DynamoDB ledger table `ptree-sync-event-ledger-{env}`
- Lambda stub targets (shared handler)

Deploy (when credentials available):

```bash
cd discoveries/assessment/infrastructure/eventbridge
sam build && sam deploy --guided
```

## Local-only (no AWS credentials)

```bash
node discoveries/assessment/scripts/simulate_eventbridge.mjs \
  discoveries/assessment/infrastructure/eventbridge/events/compact-event-examples.json
```

Routes events to stdout and appends idempotent ledger rows to `discoveries/assessment/output/event_ledger.jsonl`.

## Why full-record payloads would fail

| Constraint | Limit | Impact if full documents emitted |
|------------|-------|----------------------------------|
| EventBridge PutEvents entry | ~256 KB per event | Typical product + inventory + photos refs exceeds budget |
| DocumentDB change stream event | 16 MB max | Large `products` docs with arrays approach ceiling |
| At-least-once delivery | Duplicates | Full payloads amplify write cost and Shopware API load |
| `$facet` / correlated `$lookup` | Unsupported on DocumentDB 5.0 | Legacy collectors cannot enrich events in-stream |

**Design:** Change-stream collector writes **source ID + correlation ID + workflow hint** only. Processors fetch authoritative state from DocumentDB (or replay from S3 snapshot) and reuse baseline normalization code — same path as Batch C/D loaders.

See `target_system_blockers.md` TB-10, TB-11 and `quota_limits.md`.

## DynamoDB ledger schema

See `lambda-stub/ledger-table.json`.
