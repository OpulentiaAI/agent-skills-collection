/** Typed transform errors for assessment pipeline. */
export class TransformError extends Error {
  constructor (code, sourceId, detail, row = null) {
    super(`${code}: ${sourceId ?? 'unknown'} — ${detail}`)
    this.name = 'TransformError'
    this.code = code
    this.sourceId = sourceId
    this.detail = detail
    this.row = row
  }

  toJSON () {
    return {
      error_code: this.code,
      source_id: this.sourceId,
      detail: this.detail,
      normalized: this.row
    }
  }
}

export const ErrorCodes = Object.freeze({
  SKIPPED_DELETED: 'skipped_deleted',
  SKIPPED_UNAPPROVED: 'skipped_unapproved',
  SKIPPED_REVIEW: 'skipped_review',
  BLOCKED_MODEL_MAPPING: 'blocked_model_mapping',
  BLOCKED_NO_MEDIA: 'blocked_no_media',
  BLOCKED_PRICE_PARSE: 'blocked_price_parse',
  BLOCKED_STOCK_MISSING_REF: 'blocked_stock_missing_ref',
  BLOCKED_INVENTORY_MISSING: 'blocked_inventory_missing',
  BLOCKED_PUBLICATION_POLICY: 'blocked_publication_policy',
  UNKNOWN_ENTITY_TYPE: 'unknown_entity_type',
  PARSE_ERROR: 'parse_error'
})
