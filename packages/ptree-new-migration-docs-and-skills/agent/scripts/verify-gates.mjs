#!/usr/bin/env node
/**
 * PartsTree migration gate verifier — checks artifact presence and dry-run evidence.
 * Does not call external APIs (no credentials required).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AGENT_ROOT = path.resolve(__dirname, '..')
const PACKAGE_ROOT = path.resolve(AGENT_ROOT, '..')
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..')
const CLIENT_DATA = path.join(PACKAGE_ROOT, 'client-data')
const DISCOVERIES = path.join(PACKAGE_ROOT, 'discoveries')
const MATRICES = path.join(DISCOVERIES, 'matrices')
const MANIFESTS = path.join(CLIENT_DATA, 'manifests')

function exists (p) {
  try {
    fs.accessSync(p, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

function readJson (p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

const checks = []

function gate (id, label, pass, detail, artifacts = []) {
  checks.push({ gate: id, label, pass, detail, artifacts })
}

// G0
const g0Artifacts = {
  access_matrix: path.join(MANIFESTS, 'access_matrix.csv'),
  source_snapshot_manifest: path.join(MANIFESTS, 'source_snapshot_manifest.json'),
  environment_matrix: path.join(MANIFESTS, 'environment_matrix.csv'),
  secrets_readiness: path.join(MANIFESTS, 'secrets_readiness.md'),
  restore_proof: path.join(MANIFESTS, 'restore_proof.md')
}
const g0Present = Object.values(g0Artifacts).filter(exists).length
let g0LiveReady = false
const g0CriticalServices = ['AWS', 'DocumentDB', 'Shopware', 'CDN', 'S3']
if (exists(g0Artifacts.access_matrix)) {
  const rows = fs.readFileSync(g0Artifacts.access_matrix, 'utf8').trim().split('\n').slice(1)
  const critical = rows
    .map((r) => r.split(','))
    .filter((cols) => g0CriticalServices.includes((cols[0] || '').trim()))
  g0LiveReady = critical.length > 0 && critical.every((cols) => {
    const status = (cols[5] || '').trim()
    const owner = (cols[8] || '').trim()
    return status === 'ready' || (status === 'deferred' && owner.length > 0)
  })
}
gate(
  'G0',
  'Access and source freeze',
  g0Present >= 5 &&
    exists(g0Artifacts.source_snapshot_manifest) &&
    g0LiveReady,
  `${g0Present}/5 artifacts; live access ready=${g0LiveReady}`,
  Object.entries(g0Artifacts).filter(([, p]) => exists(p)).map(([k]) => k)
)

// G1
gate(
  'G1',
  'Source profile',
  exists(path.join(DISCOVERIES, 'profiles/source_profile.json')),
  exists(path.join(DISCOVERIES, 'profiles/source_profile.json'))
    ? 'source_profile.json present'
    : 'missing source_profile.json (dry-run summaries only)',
  ['source_profile.json'].filter((f) => exists(path.join(DISCOVERIES, 'profiles', f)))
)

// G2
const mapping = path.join(MATRICES, 'mapping_contract.csv')
const mappingStarter = path.join(MATRICES, 'mapping-contract-starter.csv')
gate(
  'G2',
  'Mapping contract',
  exists(mapping),
  exists(mapping) ? 'mapping_contract.csv present' : 'only mapping-contract-starter.csv',
  [exists(mapping) ? 'mapping_contract.csv' : 'mapping-contract-starter.csv (starter)']
)

// G3
const g3 = [
  'shopware_schema_snapshot.json',
  'custom_field_diff.csv',
  'plugin_health_report.md',
  'api_smoke_results.json'
]
const g3Count = g3.filter((f) => exists(path.join(MATRICES, f))).length
gate(
  'G3',
  'Target schema',
  g3Count === 4,
  `${g3Count}/4 Shopware contract artifacts`,
  g3.filter((f) => exists(path.join(MATRICES, f)))
)

// G4 — dry-run evidence
const dryRun = path.join(MATRICES, 'local-migration-dry-run-summary.json')
let g4Pass = false
let g4Detail = 'missing dry-run summary'
if (exists(dryRun)) {
  const d = readJson(dryRun)
  const groups = d.dry_run_groups || []
  const hasTerminal = groups.every((g) => g.loadable_count !== undefined)
  const mediaBlocked = groups.some((g) =>
    String(g.required_gate || '').includes('blocked')
  )
  g4Pass = hasTerminal && exists(path.join(MATRICES, 'quality-issue-counts.csv'))
  g4Detail = g4Pass
    ? `dry-run groups=${groups.length}; media/IPL blocked=${mediaBlocked}`
    : 'dry-run incomplete'
}
gate('G4', 'Dry-run normalization', g4Pass, g4Detail, [
  'local-migration-dry-run-summary.json',
  'quality-issue-counts.csv',
  'dry-run-groups.csv'
].filter((f) => exists(path.join(MATRICES, f))))

// G5–G8 loaders/sync (presence only)
for (const [id, label, files] of [
  ['G5', 'Dev baseline load', ['dev_load_ledger.sqlite', 'dev_target_reconciliation.json']],
  ['G6', 'Staging baseline load', ['staging_load_ledger.sqlite', 'staging_reconciliation_report.json']],
  ['G7', 'Prod baseline and cutover', ['prod_load_ledger.sqlite', 'prod_reconciliation.json']],
  ['G8', 'Ongoing sync', ['sync_event_contract.json', 'sync_processor_ledger.sqlite']]
]) {
  const present = files.filter((f) => exists(path.join(MATRICES, f)))
  gate(id, label, present.length === files.length, `${present.length}/${files.length} artifacts`, present)
}

// Workspace wiring
gate(
  'SETUP',
  'Agent skills wired',
  exists(path.join(REPO_ROOT, '.agent/skills/agentic-migration-orchestration/SKILL.md')),
  exists(path.join(REPO_ROOT, 'AGENTS.md')) ? 'AGENTS.md + .agent/skills present' : 'missing AGENTS.md',
  ['AGENTS.md', '.agent/skills'].filter((f) => exists(path.join(REPO_ROOT, f)))
)

const confluencePdfPackage = path.join(CLIENT_DATA, 'confluence/Confluence-PTREE-010626-130110.pdf')
const confluencePdfExternal = path.join(REPO_ROOT, 'agent-skills-collection/docs/Confluence-PTREE-010626-130110.pdf')
const confluencePdf = exists(confluencePdfPackage) ? confluencePdfPackage : confluencePdfExternal
gate(
  'REF',
  'Confluence PDF on disk',
  exists(confluencePdf),
  exists(confluencePdf) ? confluencePdf : 'PDF missing',
  []
)

const sampleZip = path.join(REPO_ROOT, 'agent-skills-collection/docs/input-sample-data.zip')
gate(
  'REF',
  'Sample data zip on disk',
  exists(sampleZip),
  exists(sampleZip) ? 'input-sample-data.zip present' : 'zip missing',
  []
)

// Write gate_verdicts.tsv
const tsvLines = [
  'gate\tlabel\tpass\tdetail\tchecked_at',
  ...checks.map((c) =>
    [
      c.gate,
      c.label,
      c.pass ? 'PASS' : 'FAIL',
      c.detail.replace(/\t/g, ' '),
      new Date().toISOString()
    ].join('\t')
  )
]
fs.writeFileSync(path.join(MATRICES, 'gate_verdicts.tsv'), tsvLines.join('\n') + '\n')

const failed = checks.filter((c) => !c.pass)
console.log('PartsTree migration gate verification\n')
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.gate}  ${c.label}`)
  console.log(`       ${c.detail}`)
}
console.log(`\nWrote ${path.join(MATRICES, 'gate_verdicts.tsv')}`)
console.log(`Summary: ${checks.length - failed.length}/${checks.length} passed`)
process.exit(failed.some((c) => ['G0', 'G2', 'G3', 'G4', 'SETUP'].includes(c.gate)) ? 1 : 0)
