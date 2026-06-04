#!/usr/bin/env node
/**
 * Orchestrate assessment transform dry-run:
 *   BSON → normalized JSONL → Shopware payloads + error ledger + stats
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformFile } from './transform_to_shopware_payload.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSESSMENT = path.resolve(__dirname, '..')
const OUTPUT = path.join(ASSESSMENT, 'output')

const NORMALIZED = path.join(OUTPUT, 'normalized_sample.jsonl')
const PAYLOADS = path.join(OUTPUT, 'shopware_payload_sample.jsonl')
const ERRORS = path.join(OUTPUT, 'transform_errors.jsonl')
const STATS = path.join(OUTPUT, 'transform_stats.json')

const PART_LIMIT = process.env.PART_LIMIT || '10000'
const MODEL_LIMIT = process.env.MODEL_LIMIT || '1000'

function runPythonNormalize () {
  const script = path.join(__dirname, 'transform_products.py')
  const products = path.resolve(ASSESSMENT, '../../client-data/snapshot/catalog/catalog/products.bson')
  const inventory = path.resolve(ASSESSMENT, '../../client-data/snapshot/catalog/catalog/inventory.bson')

  const result = spawnSync(
    'python3',
    [
      script,
      '--products', products,
      '--inventory', inventory,
      '--output', NORMALIZED,
      '--part-limit', PART_LIMIT,
      '--model-limit', MODEL_LIMIT
    ],
    { encoding: 'utf8', cwd: path.resolve(ASSESSMENT, '../..') }
  )

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    process.exit(result.status || 1)
  }
  try {
    const lastLine = result.stdout.trim().split('\n').pop()
    return JSON.parse(lastLine)
  } catch {
    return { parts_normalized: PART_LIMIT, models_normalized: MODEL_LIMIT }
  }
}

async function main () {
  fs.mkdirSync(OUTPUT, { recursive: true })
  console.log('Step 1: BSON → normalized …')
  const normalizeStats = runPythonNormalize()
  console.log(normalizeStats)

  console.log('Step 2: normalized → Shopware payloads …')
  const transformCounts = await transformFile(NORMALIZED, PAYLOADS, ERRORS)

  const stats = {
    generated_at: new Date().toISOString(),
    sample_limits: { parts: Number(PART_LIMIT), models: Number(MODEL_LIMIT) },
    normalize: normalizeStats,
    transform: transformCounts,
    error_rate: transformCounts.input_rows
      ? (1 - transformCounts.success / transformCounts.input_rows)
      : null,
    policies: {
      OD01_DECISION: process.env.OD01_DECISION || 'UNDECIDED',
      PUBLICATION_POLICY: process.env.PUBLICATION_POLICY || 'skip',
      STOCK_FALLBACK: process.env.STOCK_FALLBACK || 'zero',
      CDN_BASE: process.env.CDN_BASE || null
    },
    output_files: {
      normalized_sample: NORMALIZED,
      shopware_payload_sample: PAYLOADS,
      transform_errors: ERRORS
    }
  }

  fs.writeFileSync(STATS, JSON.stringify(stats, null, 2) + '\n')
  console.log('\n=== Transform dry-run summary ===')
  console.log(JSON.stringify(stats.transform, null, 2))
  console.log(`Error rate: ${(stats.error_rate * 100).toFixed(2)}%`)
  console.log(`Stats written: ${STATS}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
