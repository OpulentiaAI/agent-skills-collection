#!/usr/bin/env node
/**
 * Local EventBridge simulator — validates compact events against schema, routes to ledger.
 * Emits production contract fields (EventBridge PutEvents shape on stdout).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSESSMENT = path.resolve(__dirname, '..')
const DEFAULT_EVENTS = path.join(ASSESSMENT, 'infrastructure/eventbridge/events/compact-event-examples.json')
const LEDGER_PATH = path.join(ASSESSMENT, 'output/event_ledger.jsonl')
const SCHEMA_PATH = path.join(ASSESSMENT, 'schemas/compact-sync-event.schema.json')
const BUS_NAME = process.env.EVENT_BUS_NAME || 'ptree-catalog-sync-local'

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validateEvent = ajv.compile(JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')))

const RULES = [
  { name: 'ptree-model-changed', eventType: 'ptree.catalog.model.changed', target: 'ModelSyncProcessor' },
  { name: 'ptree-part-changed', eventType: 'ptree.catalog.part.changed', target: 'PartSyncProcessor' },
  { name: 'ptree-inventory-changed', eventType: 'ptree.catalog.inventory.changed', target: 'InventorySyncProcessor' },
  { name: 'ptree-ipl-changed', eventType: 'ptree.catalog.ipl.changed', target: 'IplSyncProcessor' },
  { name: 'ptree-media-changed', eventType: 'ptree.catalog.media.changed', target: 'MediaSyncProcessor' }
]

function ledgerKey (pk, sk) {
  return `${pk}\t${sk}`
}

function loadExistingLedger () {
  const map = new Map()
  if (!fs.existsSync(LEDGER_PATH)) return map
  for (const line of fs.readFileSync(LEDGER_PATH, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const row = JSON.parse(line)
    map.set(ledgerKey(row.pk, row.sk), row)
  }
  return map
}

function toPutEventsEntry (event) {
  return {
    Source: 'ptree.documentdb.collector',
    DetailType: event.eventType,
    EventBusName: BUS_NAME,
    Time: event.emittedAt,
    Detail: JSON.stringify({
      eventVersion: event.eventVersion,
      correlationId: event.correlationId,
      sourceCollection: event.sourceCollection,
      sourceId: event.sourceId,
      entityType: event.entityType,
      changeType: event.changeType,
      documentKey: event.documentKey,
      workflowHint: event.workflowHint,
      emittedAt: event.emittedAt,
      changeStreamToken: event.changeStreamToken ?? null
    })
  }
}

function buildLedgerRow (event) {
  const payloadHash = 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex')
  return {
    pk: `SOURCE#${event.sourceCollection}#${event.sourceId}`,
    sk: `EVENT#${event.correlationId}`,
    status: 'PENDING',
    eventType: event.eventType,
    changeType: event.changeType,
    entityType: event.entityType,
    payloadHash,
    retryCount: 0,
    lastError: null,
    replayCommand: `node discoveries/assessment/scripts/simulate_eventbridge.mjs --replay ${event.sourceCollection}:${event.sourceId}`,
    updatedAt: new Date().toISOString()
  }
}

function routeEvent (event, ledger) {
  if (!validateEvent(event)) {
    return { routed: false, reason: 'schema_validation_failed', errors: validateEvent.errors }
  }

  const rule = RULES.find((r) => r.eventType === event.eventType)
  if (!rule) {
    return { routed: false, reason: 'no_matching_rule', eventType: event.eventType }
  }

  const row = buildLedgerRow(event)
  const key = ledgerKey(row.pk, row.sk)
  const existing = ledger.get(key)
  if (existing?.status === 'COMPLETED') {
    return { routed: true, rule: rule.name, target: rule.target, idempotentSkip: true, pk: row.pk }
  }

  ledger.set(key, row)
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(row) + '\n')

  const putEntry = toPutEventsEntry(event)
  return {
    routed: true,
    rule: rule.name,
    target: rule.target,
    bus: BUS_NAME,
    ledgerStatus: 'PENDING',
    compactPayloadBytes: Buffer.byteLength(putEntry.Detail),
    putEventsEntry: putEntry
  }
}

function main () {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true })
  const ledger = loadExistingLedger()

  if (process.argv[2] === '--replay') {
    const spec = process.argv[3] || ''
    const [collection, sourceId] = spec.split(':')
    console.log(JSON.stringify({
      action: 'replay',
      collection,
      sourceId,
      note: 'Would re-enqueue PENDING events for source key; assessment stub logs only'
    }))
    return
  }

  if (process.argv[2] === '--emit') {
    const event = JSON.parse(process.argv[3])
    console.log(JSON.stringify(toPutEventsEntry(event), null, 2))
    return
  }

  const eventsPath = process.argv[2] || DEFAULT_EVENTS
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'))

  console.log(`EventBridge local simulator — bus=${BUS_NAME}`)
  console.log(`Ledger: ${LEDGER_PATH}\n`)

  for (const event of events) {
    const result = routeEvent(event, ledger)
    console.log(JSON.stringify({ event: { eventType: event.eventType, sourceId: event.sourceId }, route: result }))
  }
}

main()
