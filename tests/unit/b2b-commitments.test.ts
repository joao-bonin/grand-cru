import { describe, expect, it } from 'vitest'
import { assessB2bCommitments } from '../../server/domain/b2b/commitments'
import type { B2bCommitment, B2bReservation } from '../../shared/types/b2b'

const reservation: B2bReservation = {
  id: 'reservation-line-1',
  commitmentId: 'commitment-line-1',
  productId: 'product-1',
  storeId: 'store-1',
  baseUnit: 'UN',
  remainingQuantity: 4,
}
const commitment: B2bCommitment = {
  id: 'commitment-line-1',
  productId: 'product-1',
  storeId: 'store-1',
  baseUnit: 'UN',
  channel: 'b2b',
  quantity: 9,
  fulfilledQuantity: 0,
  cancelledQuantity: 0,
  dueDate: '2026-11-10',
  reservations: { state: 'confirmed', items: [reservation] },
}

function assess(change: Partial<B2bCommitment> = {}) {
  return assessB2bCommitments([{ ...commitment, ...change }])[0]!
}

function assessReservation(change: Partial<B2bReservation>) {
  return assess({ reservations: { state: 'confirmed', items: [{ ...reservation, ...change }] } })
}

describe('CV-12 pending B2B commitments without duplicate reservation demand', () => {
  it('adds only five incremental units for nine committed and four reserved', () => {
    expect(assess()).toMatchObject({ state: 'calculated', pendingQuantity: 9, reservedQuantity: 4, incrementalQuantity: 5, issues: [] })
  })

  it('counts the full commitment only when absence of reservations is confirmed', () => {
    expect(assess({ reservations: { state: 'confirmed', items: [] } })).toMatchObject({ state: 'calculated', reservedQuantity: 0, incrementalQuantity: 9 })
    expect(assess({ reservations: { state: 'unknown' } })).toMatchObject({ state: 'indeterminate', incrementalQuantity: null, issues: ['reservation_links_unknown'] })
  })

  it('subtracts explicit fulfilled and cancelled quantities before current outstanding reservations', () => {
    expect(assess({ fulfilledQuantity: 2, cancelledQuantity: 1 })).toMatchObject({ state: 'calculated', pendingQuantity: 6, reservedQuantity: 4, incrementalQuantity: 2 })
  })

  it('does not create demand for a fully fulfilled or fully cancelled commitment', () => {
    const reservations = { state: 'confirmed' as const, items: [] }
    expect(assess({ fulfilledQuantity: 9, reservations })).toMatchObject({ state: 'calculated', pendingQuantity: 0, incrementalQuantity: 0 })
    expect(assess({ cancelledQuantity: 9, reservations })).toMatchObject({ state: 'calculated', pendingQuantity: 0, incrementalQuantity: 0 })
  })

  it('requires reservations to describe the current outstanding allocation after settlement', () => {
    expect(assess({ fulfilledQuantity: 7 })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['reserved_quantity_exceeds_pending'] })
  })

  it('combines distinct allocations once without changing the input', () => {
    const input: B2bCommitment = { ...commitment, reservations: { state: 'confirmed', items: [reservation, { ...reservation, id: 'reservation-line-2', remainingQuantity: 2 }] } }
    const before = structuredClone(input)
    expect(assessB2bCommitments([input])[0]).toMatchObject({ pendingQuantity: 9, reservedQuantity: 6, incrementalQuantity: 3 })
    expect(input).toEqual(before)
  })

  it('excludes the store channel and preserves unknown channel classification', () => {
    expect(assess({ channel: 'store' })).toMatchObject({ state: 'excluded', incrementalQuantity: 0 })
    expect(assess({ channel: null })).toMatchObject({ state: 'indeterminate', incrementalQuantity: null, issues: ['channel_unclassified'] })
  })

  it.each([
    { fulfilledQuantity: null, issue: 'fulfillment_unknown' },
    { cancelledQuantity: null, issue: 'cancellation_unknown' },
    { dueDate: null, issue: 'due_date_unknown' },
  ])('preserves unknown commitment information %o', ({ issue, ...change }) => {
    expect(assess(change)).toMatchObject({ state: 'indeterminate', incrementalQuantity: null, issues: [issue] })
  })

  it('preserves unknown reservation quantity rather than treating it as zero', () => {
    expect(assessReservation({ remainingQuantity: null })).toMatchObject({ state: 'indeterminate', incrementalQuantity: null, issues: ['reservation_quantity_unknown'] })
  })

  it('reports all unknown inputs so an adapter can explain what remains to validate', () => {
    expect(assess({ channel: null, fulfilledQuantity: null, cancelledQuantity: null, dueDate: null, reservations: { state: 'unknown' } })).toMatchObject({
      state: 'indeterminate', incrementalQuantity: null,
      issues: ['channel_unclassified', 'fulfillment_unknown', 'cancellation_unknown', 'due_date_unknown', 'reservation_links_unknown'],
    })
  })
})

describe('CV-12 invalid quantities and inconsistent reservation links', () => {
  it.each([NaN, Infinity, -1, 0, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects unsupported committed quantity %s', (quantity) => {
    expect(assess({ quantity })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: expect.arrayContaining(['invalid_quantity']) })
  })

  it.each(['fulfilledQuantity', 'cancelledQuantity'] as const)('rejects invalid %s', (field) => {
    expect(assess({ [field]: -1 })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_quantity'] })
    expect(assess({ [field]: 0.5 })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_quantity'] })
  })

  it.each([NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])('rejects unsupported reserved quantity %s', (remainingQuantity) => {
    expect(assessReservation({ remainingQuantity })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_quantity'] })
  })

  it('rejects reservation totals beyond exact numeric precision', () => {
    const reservations = { state: 'confirmed' as const, items: [{ ...reservation, remainingQuantity: Number.MAX_SAFE_INTEGER }, { ...reservation, id: 'reservation-line-2', remainingQuantity: 1 }] }
    expect(assess({ quantity: Number.MAX_SAFE_INTEGER, reservations })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_quantity'] })
  })

  it('rejects active reserved quantities larger than the entire pending commitment', () => {
    expect(assessReservation({ remainingQuantity: 10 })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['reserved_quantity_exceeds_pending'] })
  })

  it('requires a canonical identity for each reservation line', () => {
    expect(assessReservation({ id: ' ' })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_identity'] })
  })

  it('rejects settlement above the original commitment', () => {
    expect(assess({ fulfilledQuantity: 5, cancelledQuantity: 5 })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['settled_quantity_exceeds_commitment'] })
  })

  it.each([
    { commitmentId: 'other-commitment' },
    { productId: 'other-product' },
    { storeId: 'other-store' },
    { baseUnit: 'CX' },
  ])('rejects reservation link to a different commitment scope %o', (change) => {
    expect(assessReservation(change)).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['reservation_link_mismatch'] })
  })

  it('rejects repeated reservation identities within the same commitment', () => {
    expect(assess({ reservations: { state: 'confirmed', items: [reservation, reservation] } })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['duplicate_reservation'] })
  })

  it('rejects reuse of a reservation identity across commitments', () => {
    const other: B2bCommitment = { ...commitment, id: 'commitment-line-2', reservations: { state: 'confirmed', items: [{ ...reservation, commitmentId: 'commitment-line-2' }] } }
    expect(assessB2bCommitments([commitment, other])).toEqual([
      expect.objectContaining({ state: 'invalid', incrementalQuantity: null, issues: ['duplicate_reservation'] }),
      expect.objectContaining({ state: 'invalid', incrementalQuantity: null, issues: ['duplicate_reservation'] }),
    ])
  })

  it('rejects repeated commitment identities instead of adding the same demand twice', () => {
    for (const result of assessB2bCommitments([commitment, commitment])) {
      expect(result).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: expect.arrayContaining(['duplicate_commitment']) })
    }
  })

  it.each(['2026-02-30', '2026-13-01', '10/11/2026', '2026-11-10T00:00:00Z'])('requires an explicit valid civil due date: %s', (dueDate) => {
    expect(assess({ dueDate })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: ['invalid_due_date'] })
  })

  it('does not drop commitments or reinterpret dates using an implicit planning horizon', () => {
    expect(assess({ dueDate: '2024-02-29' })).toMatchObject({ state: 'calculated', dueDate: '2024-02-29', incrementalQuantity: 5 })
    expect(assess({ dueDate: '2030-12-31' })).toMatchObject({ state: 'calculated', dueDate: '2030-12-31', incrementalQuantity: 5 })
  })

  it.each(['id', 'productId', 'storeId', 'baseUnit'] as const)('rejects an empty commitment %s', (field) => {
    expect(assess({ [field]: ' ' })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: expect.arrayContaining(['invalid_identity']) })
  })

  it('keeps invalid data blocking even when another field is unknown', () => {
    expect(assess({ quantity: -1, reservations: { state: 'unknown' } })).toMatchObject({ state: 'invalid', incrementalQuantity: null, issues: expect.arrayContaining(['invalid_quantity', 'reservation_links_unknown']) })
  })
})
