#!/usr/bin/env node
/**
 * Verify assessment artifacts exist and document transform error rate.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSESSMENT = path.resolve(__dirname, '..')
const MATRICES = path.resolve(ASSESSMENT, '../matrices')

const REQUIRED = [
  'schemas/source-product.schema.json',
  'schemas/source-inventory.schema.json',
  'schemas/normalized-product.schema.json',
  'schemas/normalized-model.schema.json',
  'schemas/normalized-ipl.schema.json',
  'schemas/shopware-product-write.schema.json',
  'schemas/shopware-category-write.schema.json',
  'schemas/shopware-media-ref.schema.json',
  'schemas/shopware-custom-fields.schema.json',
  'schemas/compact-sync-event.schema.json',
  'schemas/README.md',
  'infrastructure/eventbridge/template.yaml',
  'infrastructure/eventbridge/events/compact-event-examples.json',
  'infrastructure/eventbridge/lambda-stub/index.mjs',
  'scripts/transform_products.py',
  'scripts/transform_to_shopware_payload.mjs',
  'scripts/run_transform_dry_run.mjs',
  'scripts/simulate_eventbridge.mjs',
  'output/normalized_sample.jsonl',
  'output/shopware_payload_sample.jsonl',
  'output/transform_errors.jsonl',
  'output/transform_stats.json',
  path.relative(ASSESSMENT, path.join(MATRICES, 'assessment-issues-matrix.md')),
  path.relative(ASSESSMENT, path.join(MATRICES, 'assessment-issues-matrix.tsv'))
]

const checks = []
let pass = true

for (const rel of REQUIRED) {
  const full = path.join(ASSESSMENT, rel)
  const ok = fs.existsSync(full)
  if (!ok) pass = false
  checks.push({ path: rel, exists: ok })
}

let stats = null
const statsPath = path.join(ASSESSMENT, 'output/transform_stats.json')
if (fs.existsSync(statsPath)) {
  stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))
  if (stats.error_rate == null || stats.transform?.input_rows === 0) {
    pass = false
    checks.push({ check: 'error_rate_documented', pass: false, detail: 'no transform rows' })
  } else {
    checks.push({
      check: 'error_rate_documented',
      pass: true,
      error_rate: stats.error_rate,
      success: stats.transform.success,
      input_rows: stats.transform.input_rows
    })
  }
} else {
  pass = false
}

const report = {
  verified_at: new Date().toISOString(),
  pass,
  checks,
  stats_summary: stats?.transform || null
}

const reportPath = path.join(ASSESSMENT, 'output/verify_assessment_report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')

console.log(JSON.stringify(report, null, 2))
process.exit(pass ? 0 : 1)
