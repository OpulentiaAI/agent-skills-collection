#!/usr/bin/env node
/**
 * Validate JSON payloads against assessment JSON Schemas (ajv draft 2020-12).
 *
 * Usage:
 *   node validate_schema.mjs --schema schemas/normalized-product.schema.json --file output/normalized_sample.jsonl
 *   node validate_schema.mjs --all-examples
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSESSMENT = path.resolve(__dirname, '..')
const SCHEMAS = path.join(ASSESSMENT, 'schemas')

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)

function registerAllSchemas () {
  for (const name of fs.readdirSync(SCHEMAS).filter((f) => f.endsWith('.schema.json'))) {
    const schema = JSON.parse(fs.readFileSync(path.join(SCHEMAS, name), 'utf8'))
    ajv.addSchema(schema)
  }
}
registerAllSchemas()

function loadSchema (name) {
  const p = path.join(SCHEMAS, name)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function compile (name) {
  const schema = loadSchema(name)
  return ajv.getSchema(schema.$id) ?? ajv.compile(schema)
}

const VALIDATORS = {
  'normalized-product': () => compile('normalized-product.schema.json'),
  'normalized-model': () => compile('normalized-model.schema.json'),
  'shopware-product-write': () => compile('shopware-product-write.schema.json'),
  'compact-sync-event': () => compile('compact-sync-event.schema.json')
}

function validateJsonl (validate, filePath, limit = Infinity) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean)
  const errors = []
  let ok = 0
  for (const [i, line] of lines.entries()) {
    if (i >= limit) break
    let obj
    try {
      obj = JSON.parse(line)
    } catch (e) {
      errors.push({ line: i + 1, message: e.message })
      continue
    }
    const target = obj.payload ?? obj
    if (validate(target)) ok++
    else errors.push({ line: i + 1, source_id: obj.source_id, errors: validate.errors })
  }
  return { total: Math.min(lines.length, limit), ok, errors }
}

function validateArray (validate, arr) {
  const errors = []
  let ok = 0
  for (const [i, obj] of arr.entries()) {
    if (validate(obj)) ok++
    else errors.push({ index: i, errors: validate.errors })
  }
  return { total: arr.length, ok, errors }
}

function runAllExamples () {
  const results = []
  const normalizedPath = path.join(ASSESSMENT, 'output/normalized_sample.jsonl')
  if (fs.existsSync(normalizedPath)) {
    const parts = validateJsonl(VALIDATORS['normalized-product'](), normalizedPath, 50)
    results.push({ schema: 'normalized-product', file: normalizedPath, ...parts })
  }
  const eventsPath = path.join(ASSESSMENT, 'infrastructure/eventbridge/events/compact-event-examples.json')
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'))
  const eventVal = VALIDATORS['compact-sync-event']()
  results.push({ schema: 'compact-sync-event', file: eventsPath, ...validateArray(eventVal, events) })
  const payloadPath = path.join(ASSESSMENT, 'output/shopware_payload_sample.jsonl')
  if (fs.existsSync(payloadPath)) {
    const payloads = validateJsonl(VALIDATORS['shopware-product-write'](), payloadPath, 20)
    results.push({ schema: 'shopware-product-write', file: payloadPath, ...payloads })
  }
  return results
}

function main () {
  const args = process.argv.slice(2)
  if (args.includes('--all-examples')) {
    const results = runAllExamples()
    const failed = results.filter((r) => r.errors.length > 0)
    console.log(JSON.stringify({ results, pass: failed.length === 0 }, null, 2))
    process.exit(failed.length ? 1 : 0)
  }

  const schemaIdx = args.indexOf('--schema')
  const fileIdx = args.indexOf('--file')
  if (schemaIdx === -1 || fileIdx === -1) {
    console.error('Usage: validate_schema.mjs --schema <name> --file <path> | --all-examples')
    process.exit(2)
  }
  const schemaKey = args[schemaIdx + 1].replace(/\.schema\.json$/, '')
  const file = args[fileIdx + 1]
  const factory = VALIDATORS[schemaKey]
  if (!factory) {
    console.error(`Unknown schema key: ${schemaKey}. Known: ${Object.keys(VALIDATORS).join(', ')}`)
    process.exit(2)
  }
  const validate = factory()
  const result = file.endsWith('.jsonl')
    ? validateJsonl(validate, file)
    : validateArray(validate, JSON.parse(fs.readFileSync(file, 'utf8')))
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.errors.length ? 1 : 0)
}

main()
