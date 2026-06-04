/**
 * Minimal EventBridge Lambda target: compact event → idempotent DynamoDB ledger write.
 * Assessment stub — logs ledger row shape; production uses AWS SDK PutItem with condition.
 *
 * DynamoDB schema: ledger-table.json
 *   pk = SOURCE#{sourceCollection}#{sourceId}
 *   sk = EVENT#{correlationId}
 */
import crypto from 'node:crypto'

const STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']

export const handler = async (event) => {
  const records = event.Records || [event]
  const results = []

  for (const record of records) {
    const detail = record.detail || record
    const compact = normalizeCompactEvent(detail)
    const ledgerRow = buildLedgerRow(compact)

    // Idempotent write: skip if same pk+sk already COMPLETED
    const existing = await getLedgerRow(ledgerRow.pk, ledgerRow.sk)
    if (existing?.status === 'COMPLETED') {
      results.push({ idempotentSkip: true, pk: ledgerRow.pk, sk: ledgerRow.sk })
      continue
    }

    await putLedgerRow(ledgerRow)
    results.push({ written: true, status: ledgerRow.status, pk: ledgerRow.pk })
  }

  return { batchItemFailures: [], results }
}

function normalizeCompactEvent (detail) {
  const required = ['eventType', 'correlationId', 'sourceCollection', 'sourceId', 'changeType']
  for (const k of required) {
    if (!detail[k]) throw new Error(`Missing compact event field: ${k}`)
  }
  return detail
}

function buildLedgerRow (compact) {
  const payloadHash = 'sha256:' + crypto
    .createHash('sha256')
    .update(JSON.stringify(compact))
    .digest('hex')

  const pk = `SOURCE#${compact.sourceCollection}#${compact.sourceId}`
  const sk = `EVENT#${compact.correlationId}`

  return {
    pk,
    sk,
    status: 'PENDING',
    eventType: compact.eventType,
    changeType: compact.changeType,
    entityType: compact.entityType || null,
    payloadHash,
    retryCount: 0,
    lastError: null,
    replayCommand: `node discoveries/assessment/scripts/simulate_eventbridge.mjs --replay ${compact.sourceCollection}:${compact.sourceId}`,
    updatedAt: new Date().toISOString()
  }
}

/** @type {Map<string, object>} in-memory ledger for local stub */
const memoryLedger = new Map()

async function getLedgerRow (pk, sk) {
  if (process.env.LEDGER_TABLE) {
    // Production: DynamoDB GetItem
    return memoryLedger.get(`${pk}#${sk}`) || null
  }
  return memoryLedger.get(`${pk}#${sk}`) || null
}

async function putLedgerRow (row) {
  if (process.env.LEDGER_TABLE) {
    // Production: DynamoDB PutItem with ConditionExpression
    console.log(JSON.stringify({ action: 'PutItem', table: process.env.LEDGER_TABLE, row }))
  }
  memoryLedger.set(`${row.pk}#${row.sk}`, row)
}
