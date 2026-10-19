import type { B2bCommitment, B2bCommitmentDemand, B2bDemandIssue } from '../../../shared/types/b2b'

function countIdentities(ids: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  return counts
}

function validIdentity(value: string): boolean {
  return value.trim().length > 0
}

function validQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

function validDueDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/**
 * Assesses a complete batch without summing different products, stores or units.
 * Canonical commitment and reservation-line identities must be unique across it.
 * This is incremental demand relative to availability that already excludes these
 * reservations; do not add it to physical stock or subtract the reservations again.
 * Due dates are preserved, never silently filtered by an assumed planning policy.
 */
export function assessB2bCommitments(commitments: readonly B2bCommitment[]): B2bCommitmentDemand[] {
  const commitmentCounts = countIdentities(commitments.map(item => item.id))
  const reservationCounts = countIdentities(commitments.flatMap(item => item.reservations.state === 'confirmed' ? item.reservations.items.map(reservation => reservation.id) : []))

  return commitments.map((commitment): B2bCommitmentDemand => {
    const reference = { commitmentId: commitment.id, productId: commitment.productId, storeId: commitment.storeId, baseUnit: commitment.baseUnit, dueDate: commitment.dueDate }
    const invalid = new Set<B2bDemandIssue>()
    const unknown = new Set<B2bDemandIssue>()
    if (![commitment.id, commitment.productId, commitment.storeId, commitment.baseUnit].every(validIdentity)) invalid.add('invalid_identity')
    if (commitmentCounts.get(commitment.id)! > 1) invalid.add('duplicate_commitment')
    if (commitment.channel === 'store' && invalid.size === 0) {
      return { ...reference, state: 'excluded', pendingQuantity: null, reservedQuantity: null, incrementalQuantity: 0, issues: [] }
    }
    if (commitment.channel !== 'b2b' && commitment.channel !== 'store') unknown.add('channel_unclassified')

    const { quantity, fulfilledQuantity, cancelledQuantity, dueDate } = commitment
    if (!validQuantity(quantity) || quantity === 0) invalid.add('invalid_quantity')
    if (fulfilledQuantity === null) unknown.add('fulfillment_unknown')
    else if (!validQuantity(fulfilledQuantity)) invalid.add('invalid_quantity')
    if (cancelledQuantity === null) unknown.add('cancellation_unknown')
    else if (!validQuantity(cancelledQuantity)) invalid.add('invalid_quantity')
    if (dueDate === null) unknown.add('due_date_unknown')
    else if (!validDueDate(dueDate)) invalid.add('invalid_due_date')

    let pendingQuantity: number | null = null
    if (validQuantity(quantity) && quantity > 0 && fulfilledQuantity !== null && validQuantity(fulfilledQuantity) && cancelledQuantity !== null && validQuantity(cancelledQuantity)) {
      if (cancelledQuantity > quantity || fulfilledQuantity > quantity - cancelledQuantity) invalid.add('settled_quantity_exceeds_commitment')
      else pendingQuantity = quantity - fulfilledQuantity - cancelledQuantity
    }

    let reservedQuantity = 0
    if (commitment.reservations.state === 'unknown') unknown.add('reservation_links_unknown')
    else {
      for (const reservation of commitment.reservations.items) {
        if (![reservation.id, reservation.commitmentId, reservation.productId, reservation.storeId, reservation.baseUnit].every(validIdentity)) invalid.add('invalid_identity')
        if (reservation.commitmentId !== commitment.id || reservation.productId !== commitment.productId || reservation.storeId !== commitment.storeId || reservation.baseUnit !== commitment.baseUnit) invalid.add('reservation_link_mismatch')
        if (reservationCounts.get(reservation.id)! > 1) invalid.add('duplicate_reservation')
        if (reservation.remainingQuantity === null) unknown.add('reservation_quantity_unknown')
        else if (!validQuantity(reservation.remainingQuantity) || reservedQuantity > Number.MAX_SAFE_INTEGER - reservation.remainingQuantity) invalid.add('invalid_quantity')
        else reservedQuantity += reservation.remainingQuantity
      }
      if (pendingQuantity !== null && reservedQuantity > pendingQuantity) invalid.add('reserved_quantity_exceeds_pending')
    }

    if (invalid.size || unknown.size) {
      return { ...reference, state: invalid.size ? 'invalid' : 'indeterminate', pendingQuantity: null, reservedQuantity: null, incrementalQuantity: null, issues: [...invalid, ...unknown] }
    }
    // Nulls are rejected above; these values remain explicit in the calculation evidence.
    return { ...reference, state: 'calculated', committedQuantity: quantity, fulfilledQuantity: fulfilledQuantity!, cancelledQuantity: cancelledQuantity!, pendingQuantity: pendingQuantity!, reservedQuantity, incrementalQuantity: pendingQuantity! - reservedQuantity, issues: [] }
  })
}
