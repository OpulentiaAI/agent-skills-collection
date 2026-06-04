import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePart,
  normalizeModel,
  workflowStatus,
  parsePrice
} from '../lib/normalize-product.mjs'

const PART_LOADABLE = {
  source: 'ARIPS22PRT 3034421027E1K1001',
  type: 'part',
  title: '3034421027E1K1001',
  stock: 'CSYSBRP 3034421027E1K1001',
  photos: [],
  meta: { approved: true, deleted: false, review: null },
  marketing_brand: ['Snapper']
}

const PART_WITH_PHOTOS = {
  source: 'ARIPS22PRT 3035744',
  type: 'part',
  title: '3035744',
  stock: 'CSYSBRP 3035744',
  photos: ['CSYSSNA 703065 5672e00b7067b', 'CSYSSNA 703065 5672e00ce77a7'],
  meta: { approved: true, deleted: false, review: null },
  marketing_brand: ['Snapper']
}

const MODEL_WITH_IPL = {
  source: 'ARIPS01MDL 190-118-000 Mulch Kit (2010)',
  type: 'model',
  model_name: ['190-118-000'],
  ipl: ['ARIPS01IPL W0093000001'],
  photos: [],
  meta: { approved: true, deleted: true, comments: 'Duplicate', review: null },
  product_family: ['Accessories & Attachments']
}

const PART_UNAPPROVED = {
  source: 'TESTPRT UNAPPROVED',
  type: 'part',
  stock: 'CSYSTEST 1',
  meta: { approved: false, deleted: false, review: null }
}

const INVENTORY_INDEX = {
  'CSYSBRP 3034421027E1K1001': {
    source: 'CSYSBRP 3034421027E1K1001',
    price: '12.99',
    availability: 'ava',
    quantity_on_hand: 0,
    meta: { approved: true, deleted: false }
  }
}

describe('normalize-product', () => {
  it('joins part stock to inventory with parsed price', () => {
    const row = normalizePart(PART_LOADABLE, INVENTORY_INDEX)
    assert.equal(row.workflow_status, 'loadable')
    assert.equal(row.stock_join_status, 'joined')
    assert.equal(row.inventory.price, 12.99)
    assert.equal(row.inventory.quantity_status, 'zero')
    assert.deepEqual(row.brand_keys, ['Snapper'])
  })

  it('blocks media when photos present but assets collection absent', () => {
    const row = normalizePart(PART_WITH_PHOTOS, {}, { assetsCollectionPresent: false })
    assert.equal(row.media_status, 'blocked_no_assets_collection')
    assert.equal(row.photos_refs.length, 2)
  })

  it('marks deleted model workflow as skipped_deleted', () => {
    assert.equal(workflowStatus(MODEL_WITH_IPL), 'skipped_deleted')
    const row = normalizeModel(MODEL_WITH_IPL)
    assert.equal(row.workflow_status, 'skipped_deleted')
    assert.deepEqual(row.ipl_refs, ['ARIPS01IPL W0093000001'])
  })

  it('flags unapproved parts as skipped_unapproved', () => {
    const row = normalizePart(PART_UNAPPROVED, INVENTORY_INDEX)
    assert.equal(row.workflow_status, 'skipped_unapproved')
  })

  it('parsePrice handles string decimals and rejects garbage', () => {
    assert.deepEqual(parsePrice('26.99'), { ok: true, price: 26.99 })
    assert.deepEqual(parsePrice('not-a-price'), { ok: false, price: null })
  })
})
