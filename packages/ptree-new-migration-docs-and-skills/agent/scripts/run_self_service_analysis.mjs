#!/usr/bin/env node
/**
 * Prints analysis artifact paths and optional refresh commands.
 * Does not run agents — see notes/guides/analysis-self-service-guide.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AGENT_ROOT = path.resolve(__dirname, '..')
const PACKAGE_ROOT = path.resolve(AGENT_ROOT, '..')
const DISCOVERIES = path.join(PACKAGE_ROOT, 'discoveries')
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..')

const PATHS = {
  masterBrief: path.join(AGENT_ROOT, 'prompts/RECREATE-ANALYSIS-AGENT-PROMPT.md'),
  semanticLayer: path.join(DISCOVERIES, 'semantic-layer.md'),
  guide: path.join(PACKAGE_ROOT, 'notes/guides/analysis-self-service-guide.md'),
  sourceProfile: path.join(DISCOVERIES, 'profiles/source_profile.json'),
  transformStats: path.join(DISCOVERIES, 'assessment/output/transform_stats.json'),
  segmentDir: path.join(DISCOVERIES, 'segments'),
  intentReport: path.join(DISCOVERIES, 'intent/intent-comparison-report.md'),
  blockerMatrix: path.join(DISCOVERIES, 'blockers/blocker-delay-matrix.tsv'),
  blockerNarrative: path.join(DISCOVERIES, 'blockers/blocker-delay-narrative.md'),
  profileScript: path.join(AGENT_ROOT, 'scripts/profile_source_bson.py'),
  dryRunScript: path.join(DISCOVERIES, 'assessment/scripts/run_transform_dry_run.mjs'),
}

const SEGMENTS = [
  'products_parts',
  'products_models',
  'inventory',
  'workflow_meta',
  'stock_joins',
  'media_ipl',
  'brands_on_products',
]

function exists (p) {
  try {
    fs.accessSync(p, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

function line (label, ok, detail = '') {
  const mark = ok ? '[ok]' : '[—]'
  console.log(`  ${mark} ${label}${detail ? ` (${detail})` : ''}`)
}

function main () {
  console.log('PartsTree analysis — artifact checklist\n')
  console.log('Package:', PACKAGE_ROOT)
  console.log('Master brief:', PATHS.masterBrief)
  console.log('Guide:', PATHS.guide)
  console.log('')

  console.log('Ground truth')
  line('semantic-layer.md', exists(PATHS.semanticLayer))
  line('source_profile.json', exists(PATHS.sourceProfile))
  line('transform_stats.json', exists(PATHS.transformStats))
  console.log('')

  if (!exists(PATHS.sourceProfile)) {
    console.log('Refresh profile (repo root):')
    console.log(`  python3 ${PATHS.profileScript}`)
    console.log('')
  }

  if (!exists(PATHS.transformStats)) {
    console.log('Optional dry-run (needs extracted BSON):')
    console.log(`  node ${PATHS.dryRunScript}`)
    console.log('')
  }

  console.log('Typical outputs (create as you analyze)')
  for (const seg of SEGMENTS) {
    const out = path.join(PATHS.segmentDir, `${seg}.md`)
    line(`segments/${seg}.md`, exists(out))
  }
  line('intent/intent-comparison-report.md', exists(PATHS.intentReport))
  line('blockers/blocker-delay-matrix.tsv', exists(PATHS.blockerMatrix))
  line('blockers/blocker-delay-narrative.md', exists(PATHS.blockerNarrative))
  console.log('')

  console.log('Optional skills: ptree-segment-data-analyst, ptree-intent-comparison-analyst, ptree-blocker-delay-mapper')
  console.log('Done — checklist only; agents follow RECREATE brief or guide.')
}

main()
