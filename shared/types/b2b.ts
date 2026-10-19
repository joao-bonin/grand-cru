export type SalesChannel = 'store' | 'b2b'

export type ChannelClassification =
  | { state: 'classified', sourceChannel: string, channel: SalesChannel }
  | { state: 'unclassified', sourceChannel: string | null, channel: null, reason: 'missing_channel' | 'unmapped_channel' }

/** One current reservation line allocated entirely to one canonical commitment line. */
export interface B2bReservation {
  id: string
  commitmentId: string
  productId: string
  storeId: string
  baseUnit: string
  /** Remaining active allocation, after fulfillment/cancellation; null means unconfirmed. */
  remainingQuantity: number | null
}

/**
 * Quantities are exact, whole base-unit counts (safe integers), already normalized
 * by the caller. Package conversion and fractional units are not supported here.
 * Fulfillment and cancellation are disjoint cumulative quantities from the original
 * commitment. Missing evidence must be null, never an assumed zero.
 */
export interface B2bCommitment {
  id: string
  productId: string
  storeId: string
  baseUnit: string
  channel: SalesChannel | null
  quantity: number
  fulfilledQuantity: number | null
  cancelledQuantity: number | null
  /** Explicit civil YYYY-MM-DD date; no implicit timezone or planning horizon. */
  dueDate: string | null
  /** A confirmed empty list establishes no reservations; unknown does not. */
  reservations: { state: 'unknown' } | { state: 'confirmed', items: readonly B2bReservation[] }
}

export type B2bDemandIssue =
  | 'invalid_identity'
  | 'duplicate_commitment'
  | 'channel_unclassified'
  | 'invalid_quantity'
  | 'fulfillment_unknown'
  | 'cancellation_unknown'
  | 'due_date_unknown'
  | 'invalid_due_date'
  | 'settled_quantity_exceeds_commitment'
  | 'reservation_links_unknown'
  | 'reservation_quantity_unknown'
  | 'reservation_link_mismatch'
  | 'duplicate_reservation'
  | 'reserved_quantity_exceeds_pending'

interface B2bDemandReference {
  commitmentId: string
  productId: string
  storeId: string
  baseUnit: string
  dueDate: string | null
}

export type B2bCommitmentDemand = B2bDemandReference & (
  | {
    state: 'calculated'
    committedQuantity: number
    fulfilledQuantity: number
    cancelledQuantity: number
    pendingQuantity: number
    reservedQuantity: number
    incrementalQuantity: number
    issues: []
  }
  | {
    state: 'excluded'
    pendingQuantity: null
    reservedQuantity: null
    incrementalQuantity: 0
    issues: []
  }
  | {
    state: 'invalid' | 'indeterminate'
    pendingQuantity: null
    reservedQuantity: null
    incrementalQuantity: null
    issues: B2bDemandIssue[]
  }
)
