#!/usr/bin/env node
/**
 * Map normalized JSONL → Shopware write payloads.
 * Delegates to lib/shopware-mapper.mjs (config-driven policies).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPolicy, transformStream } from '../lib/shopware-mapper.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSESSMENT = path.resolve(__dirname, '..')

export { loadPolicy, transformStream, mapNormalizedRow, mapPartRow, mapModelRow } from '../lib/shopware-mapper.mjs'

export async function transformFile (inputPath, payloadOut, errorsOut, policy) {
  return transformStream(inputPath, payloadOut, errorsOut, policy ?? loadPolicy())
}

async function main () {
  const input = process.argv[2] || path.join(ASSESSMENT, 'output/normalized_sample.jsonl')
  const payloadOut = process.argv[3] || path.join(ASSESSMENT, 'output/shopware_payload_sample.jsonl')
  const errorsOut = process.argv[4] || path.join(ASSESSMENT, 'output/transform_errors.jsonl')

  fs.mkdirSync(path.dirname(payloadOut), { recursive: true })
  const counts = await transformFile(input, payloadOut, errorsOut)
  console.log(JSON.stringify(counts, null, 2))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
