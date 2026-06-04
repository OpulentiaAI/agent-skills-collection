/**
 * Pure normalization: Catalog DB BSON-shaped docs → intermediate JSON rows.
 * Unit-testable; no I/O.
 */
import crypto from 'node:crypto'

export function truthy (val) {
  if (val == null) return false
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  if (typeof val === 'string') {
    return !['', 'false', '0', 'no', 'null', 'none'].includes(val.trim().toLowerCase())
  }
  return true
}

export function metaFlag (doc, key) {
  const meta = doc?.meta
  if (meta && typeof meta === 'object' && key in meta) return meta[key]
  return doc?.[key]
}

export function empty (val) {
  if (val == null) return true
  if (typeof val === 'string') return !val.trim()
  if (Array.isArray(val) || (typeof val === 'object' && val !== null)) return val.length === 0
  return false
}

export function parsePrice (val) {
  if (val == null) return { ok: false, price: null }
  if (typeof val === 'number') return { ok: true, price: val }
  if (typeof val === 'string') {
    const s = val.trim().replace(/,/g, '')
    if (!s) return { ok: false, price: null }
    const n = Number(s)
    return Number.isFinite(n) ? { ok: true, price: n } : { ok: false, price: null }
  }
  return { ok: false, price: null }
}

export function brandKeys (doc) {
  const keys = new Set()
  for (const field of ['marketing_brand', 'manufacturing_brand']) {
    const val = doc?.[field]
    if (Array.isArray(val)) {
      for (const x of val) if (x) keys.add(String(x).trim())
    } else if (typeof val === 'string' && val.trim()) {
      keys.add(val.trim())
    }
  }
  return [...keys].sort()
}

export function payloadHash (obj) {
  const raw = JSON.stringify(obj, Object.keys(obj).sort())
  return 'sha256:' + crypto.createHash('sha256').update(raw).digest('hex')
}

export function workflowStatus (doc) {
  if (truthy(metaFlag(doc, 'deleted'))) return 'skipped_deleted'
  if (!truthy(metaFlag(doc, 'approved'))) return 'skipped_unapproved'
  const review = metaFlag(doc, 'review')
  if (review != null && review !== '' && review !== false && !(Array.isArray(review) && review.length === 0)) {
    return 'skipped_review'
  }
  return 'loadable'
}

export function stockRefFromDoc (doc) {
  const stock = doc?.stock
  if (typeof stock === 'string' && stock.trim()) return stock.trim()
  if (stock != null && stock !== '') return String(stock)
  return null
}

/**
 * @param {object} doc - products.bson document (type=part)
 * @param {Map<string, object>|Record<string, object>} inventoryIndex
 * @param {{ assetsCollectionPresent?: boolean }} [opts]
 */
export function normalizePart (doc, inventoryIndex = {}, opts = {}) {
  const assetsPresent = opts.assetsCollectionPresent === true
  const stockRef = stockRefFromDoc(doc)
  const wf = workflowStatus(doc)
  const photos = doc?.photos ?? []
  const photosRefs = photos.filter(Boolean).map(String)

  let stockJoinStatus = 'missing_ref'
  let inventory = null

  if (stockRef) {
    const inv = inventoryIndex instanceof Map
      ? inventoryIndex.get(stockRef)
      : inventoryIndex[stockRef]
    if (inv == null) {
      stockJoinStatus = 'missing_inventory'
    } else if (truthy(metaFlag(inv, 'deleted'))) {
      stockJoinStatus = 'inventory_deleted'
    } else {
      stockJoinStatus = 'joined'
      const { ok, price } = parsePrice(inv.price)
      const qty = inv.quantity_on_hand
      let quantityStatus = 'absent'
      if (qty != null) quantityStatus = qty === 0 ? 'zero' : 'present'
      inventory = {
        price: ok ? price : null,
        price_parse_ok: ok,
        availability: inv.availability ?? null,
        quantity_on_hand: qty != null ? Number(qty) : null,
        quantity_status: quantityStatus
      }
    }
  }

  let mediaStatus = 'empty_refs'
  if (photosRefs.length > 0) {
    mediaStatus = assetsPresent ? 'has_refs' : 'blocked_no_assets_collection'
  }

  const row = {
    source_id: doc?.source ?? null,
    entity_type: 'part',
    title: doc?.title ?? null,
    workflow_status: wf,
    meta_approved: truthy(metaFlag(doc, 'approved')),
    meta_deleted: truthy(metaFlag(doc, 'deleted')),
    meta_review: metaFlag(doc, 'review') ?? null,
    stock_ref: stockRef,
    stock_join_status: stockJoinStatus,
    inventory,
    photos_refs: photosRefs,
    media_status: mediaStatus,
    brand_keys: brandKeys(doc)
  }
  row.payload_hash = payloadHash(row)
  return row
}

/**
 * @param {object} doc - products.bson document (type=model)
 */
export function normalizeModel (doc) {
  let wf = workflowStatus(doc)
  if (wf === 'loadable') wf = 'blocked_od01_mapping'
  const ipl = doc?.ipl ?? []
  const iplRefs = ipl.filter(Boolean).map(String)
  const row = {
    source_id: doc?.source ?? null,
    entity_type: 'model',
    model_name: doc?.model_name ?? null,
    product_family: doc?.product_family ?? null,
    workflow_status: wf,
    shopware_target_decision: 'UNDECIDED_OD01',
    ipl_refs: iplRefs,
    brand_keys: brandKeys(doc),
    photos_refs: (doc?.photos ?? []).filter(Boolean).map(String)
  }
  row.payload_hash = payloadHash(row)
  return row
}
