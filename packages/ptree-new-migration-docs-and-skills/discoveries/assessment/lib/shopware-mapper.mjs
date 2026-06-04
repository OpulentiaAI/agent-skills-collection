/**
 * Map normalized rows → Shopware write payloads (JSON only; no API calls).
 * Config-driven policy branches with explicit error codes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ErrorCodes, TransformError } from './errors.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_POLICY_PATH = path.join(__dirname, '../config/target-mapping-policy.json')

export function loadPolicy (policyPath = DEFAULT_POLICY_PATH) {
  const raw = JSON.parse(fs.readFileSync(policyPath, 'utf8'))
  return resolvePolicy(raw)
}

export function resolvePolicy (filePolicy, env = process.env) {
  const modelDecision = env.OD01_DECISION || filePolicy.modelTarget?.decision || 'undecided'
  return {
    modelDecision,
    modelBlocked: modelDecision !== 'category' && modelDecision !== 'custom_entity',
    publicationDeleted: env.PUBLICATION_POLICY || filePolicy.publication?.deletedPolicy || 'skip',
    publicationUnapproved: filePolicy.publication?.unapprovedPolicy || 'skip',
    publicationReview: filePolicy.publication?.reviewPolicy || 'skip',
    stockEmptyFallback: env.STOCK_FALLBACK || filePolicy.stock?.emptyStockRefFallback || 'zero',
    stockQtyFallback: filePolicy.stock?.missingQuantityFallback || 'zero',
    cdnBase: env.CDN_BASE || filePolicy.media?.cdnBase || null,
    assetsPresent: filePolicy.assets?.collectionPresent === true,
    currencyId: filePolicy.shopware?.currencyIdPlaceholder || 'PLACEHOLDER_USD'
  }
}

export function initCounts () {
  return {
    input_rows: 0,
    success: 0,
    skipped_deleted: 0,
    skipped_unapproved: 0,
    skipped_review: 0,
    blocked_model_mapping: 0,
    blocked_no_media: 0,
    blocked_price_parse: 0,
    blocked_stock_missing_ref: 0,
    stock_fallback_used: 0,
    blocked_inventory_missing: 0,
    blocked_publication_policy: 0,
    other_errors: 0
  }
}

export function bumpCount (counts, code) {
  if (code in counts && code !== 'input_rows' && code !== 'success') counts[code]++
  else if (code !== 'success') counts.other_errors++
}

/**
 * @returns {{ payload: object|null, error: TransformError|null, sideEffects?: object }}
 */
export function mapModelRow (row, policy = resolvePolicy({})) {
  if (row.workflow_status === 'skipped_deleted') {
    return { payload: null, error: new TransformError(ErrorCodes.SKIPPED_DELETED, row.source_id, 'meta.deleted=true', row) }
  }
  if (row.workflow_status === 'skipped_unapproved') {
    return { payload: null, error: new TransformError(ErrorCodes.SKIPPED_UNAPPROVED, row.source_id, 'meta.approved=false', row) }
  }
  if (row.shopware_target_decision === 'UNDECIDED_OD01' || policy.modelBlocked) {
    return { payload: null, error: new TransformError(ErrorCodes.BLOCKED_MODEL_MAPPING, row.source_id, 'model→category vs custom entity undecided', row) }
  }

  const name = Array.isArray(row.model_name) ? row.model_name[0] : row.source_id
  const payload = {
    name,
    active: true,
    visible: true,
    type: policy.modelDecision === 'custom_entity' ? 'custom_entity' : 'model',
    source_id: row.source_id,
    customFields: {
      custom_model_source_id: row.source_id,
      custom_ipl_source_id: row.ipl_refs?.[0] ?? null
    }
  }
  return { payload: { entity_type: 'model', source_id: row.source_id, payload }, error: null }
}

/**
 * @returns {{ payload: object|null, error: TransformError|null, sideEffects?: object }}
 */
export function mapPartRow (row, policy = resolvePolicy({})) {
  if (row.workflow_status === 'skipped_deleted') {
    if (policy.publicationDeleted === 'load_inactive') {
      // Future: emit active=false payload when client approves policy
    }
    return { payload: null, error: new TransformError(ErrorCodes.SKIPPED_DELETED, row.source_id, 'meta.deleted=true', row) }
  }
  if (row.workflow_status === 'skipped_unapproved') {
    return { payload: null, error: new TransformError(ErrorCodes.SKIPPED_UNAPPROVED, row.source_id, 'meta.approved=false', row) }
  }
  if (row.workflow_status === 'skipped_review') {
    return { payload: null, error: new TransformError(ErrorCodes.SKIPPED_REVIEW, row.source_id, 'meta.review set', row) }
  }

  if (row.media_status === 'blocked_no_assets_collection' && row.photos_refs?.length > 0) {
    return {
      payload: null,
      error: new TransformError(
        ErrorCodes.BLOCKED_NO_MEDIA,
        row.source_id,
        `photos_refs=${row.photos_refs.length}; assets.bson missing`,
        row
      )
    }
  }

  const sideEffects = { stock_fallback_used: false }

  if (row.stock_join_status === 'missing_ref') {
    if (policy.stockEmptyFallback !== 'zero') {
      return { payload: null, error: new TransformError(ErrorCodes.BLOCKED_STOCK_MISSING_REF, row.source_id, 'empty products.stock', row) }
    }
    sideEffects.stock_fallback_used = true
  }
  if (row.stock_join_status === 'missing_inventory') {
    return { payload: null, error: new TransformError(ErrorCodes.BLOCKED_INVENTORY_MISSING, row.source_id, 'stock ref not in inventory', row) }
  }

  const inv = row.inventory || {}
  if (inv.price_parse_ok === false) {
    return { payload: null, error: new TransformError(ErrorCodes.BLOCKED_PRICE_PARSE, row.source_id, 'inventory price unparseable', row) }
  }

  let stockQty = 0
  if (inv.quantity_status === 'present' || inv.quantity_status === 'zero') {
    stockQty = inv.quantity_on_hand ?? 0
  } else if (inv.quantity_status === 'absent') {
    if (policy.stockQtyFallback === 'zero') {
      stockQty = 0
      sideEffects.stock_fallback_used = true
    }
  }

  const payload = {
    productNumber: row.source_id,
    name: row.title || row.source_id,
    active: true,
    idempotencyKey: row.source_id,
    stock: { stock: stockQty },
    customFields: {
      custom_part_source_id: row.source_id,
      custom_part_pt_stock_id: row.stock_ref,
      custom_part_availability_code: inv.availability ?? null
    }
  }

  if (inv.price != null) {
    payload.price = [{ currencyId: policy.currencyId, gross: inv.price, net: inv.price }]
  }

  if (row.photos_refs?.length > 0 && policy.cdnBase) {
    payload.media = row.photos_refs.map((ref, i) => ({
      sourceAssetId: ref,
      cdnUrl: `${policy.cdnBase}/${encodeURIComponent(ref)}`,
      mediaStatus: 'resolved',
      position: i,
      cover: i === 0
    }))
  }

  return {
    payload: { entity_type: 'part', source_id: row.source_id, payload },
    error: null,
    sideEffects
  }
}

export function mapNormalizedRow (row, policy = resolvePolicy({})) {
  if (row.entity_type === 'model') return mapModelRow(row, policy)
  if (row.entity_type === 'part') return mapPartRow(row, policy)
  return { payload: null, error: new TransformError(ErrorCodes.UNKNOWN_ENTITY_TYPE, row.source_id, row.entity_type, row) }
}

export async function transformStream (inputPath, payloadOut, errorsOut, policy = loadPolicy()) {
  const fsPromises = await import('node:fs/promises')
  const readline = await import('node:readline')
  const counts = initCounts()

  const payloadStream = (await import('node:fs')).createWriteStream(payloadOut)
  const errorsStream = (await import('node:fs')).createWriteStream(errorsOut)

  const rl = readline.createInterface({
    input: (await import('node:fs')).createReadStream(inputPath),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    let row
    try {
      row = JSON.parse(line)
    } catch (e) {
      bumpCount(counts, ErrorCodes.PARSE_ERROR)
      errorsStream.write(JSON.stringify(new TransformError(ErrorCodes.PARSE_ERROR, null, e.message).toJSON()) + '\n')
      continue
    }

    counts.input_rows++
    const { payload, error, sideEffects } = mapNormalizedRow(row, policy)

    if (error) {
      bumpCount(counts, error.code)
      errorsStream.write(JSON.stringify(error.toJSON()) + '\n')
      continue
    }

    if (sideEffects?.stock_fallback_used) counts.stock_fallback_used++
    payloadStream.write(JSON.stringify(payload) + '\n')
    counts.success++
  }

  await new Promise((resolve) => {
    payloadStream.end(() => errorsStream.end(resolve))
  })

  return counts
}
