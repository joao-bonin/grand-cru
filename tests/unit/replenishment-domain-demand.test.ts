import { describe, expect, it } from 'vitest'
import type { Sale } from '../../shared/types/replenishment'
import { calculateNetDemand } from '../../server/domain/replenishment/net-demand'
import { civilDay } from '../../server/domain/replenishment/dates'

const now = new Date('2026-10-16T12:00:00-03:00')
const sale: Sale = { id: 'item-1', documentId: 'coupon-1', productId: '1', storeId: '1', date: '2026-10-15', quantity: 10, kind: 'sale', cancelled: false, originalSaleId: null }
const calculate = (sales: Sale[], history: string | null = '2025-01-01') => calculateNetDemand(sales, '1', '1', history, now, 30)
describe('CV-04 total net demand', () => {
  it('counts ten minus two as eight and deduplicates canonical items across documents', () => {
    const result = calculate([sale, { ...sale, documentId: 'invoice-1' }, { ...sale, id: 'return-1', quantity: 2, kind: 'return', originalSaleId: sale.id }, { ...sale, id: 'cancelled', quantity: 100, cancelled: true }, { ...sale, id: 'other-store', storeId: '2', quantity: 100 }])
    expect(result.windows['30']).toEqual({ quantity: 8, partial: false })
    expect(result.dailyDemand).toBeCloseTo(8 / 30)
  })
  it('uses inclusive lower and exclusive upper civil-day bounds for all four windows', () => {
    const result = calculate([
      { ...sale, id: 'today', date: '2026-10-16', quantity: 100 },
      { ...sale, id: 'd30', date: '2026-09-16', quantity: 1 },
      { ...sale, id: 'd60', date: '2026-08-17', quantity: 2 },
      { ...sale, id: 'd90', date: '2026-07-18', quantity: 4 },
      { ...sale, id: 'd365', date: '2025-10-16', quantity: 8 },
    ])
    expect(Object.fromEntries(Object.entries(result.windows).map(([key, value]) => [key, value.quantity]))).toEqual({ 30: 1, 60: 3, 90: 7, 365: 15 })
  })
  it('marks long windows partial and blocks demand from unproven history', () => {
    const result = calculate([sale], '2026-08-17')
    expect(result.windows['365'].partial).toBe(true)
    expect(result.windows['60'].partial).toBe(false)
    expect(calculate([], null).dailyDemand).toBeNull()
    expect(calculate([], '2026-10-10').dailyDemand).toBeNull()
    expect(calculate([], '2025-01-01').dailyDemand).toBe(0)
  })
  it('does not invent reconciled demand for unlinked returns or invalid dates', () => {
    expect(calculate([{ ...sale, id: 'r', kind: 'return' }]).dailyDemand).toBeNull()
    expect(calculate([{ ...sale, date: '2026-02-30' }]).dailyDemand).toBeNull()
  })
  it('does not subtract a return for a cancelled or another-store sale', () => {
    expect(calculate([{ ...sale, cancelled: true }, { ...sale, id: 'r', kind: 'return', originalSaleId: sale.id, quantity: 2 }]).windows['30'].quantity).toBe(0)
    expect(calculate([{ ...sale, storeId: '2' }, { ...sale, id: 'r', kind: 'return', originalSaleId: sale.id, quantity: 2 }]).dailyDemand).toBeNull()
  })
  it('uses Sao Paulo rather than UTC dates and rejects overflowing calendar dates', () => {
    expect(civilDay('2026-10-16T01:00:00Z')).toBe(civilDay('2026-10-15'))
    expect(civilDay('2026-02-30')).toBeNull()
  })
})

describe('CV-04 invalid source data cannot create confident consumption', () => {
  it('rejects overflowing timestamp dates instead of normalizing February into March', () => {
    expect(civilDay('2026-02-30T12:00:00Z')).toBeNull()
  })
  it('rejects returns larger than their linked original sale', () => {
    const result = calculateNetDemand([sale, { ...sale, id: 'r', kind: 'return', originalSaleId: sale.id, quantity: 12 }, { ...sale, id: 'other', quantity: 100 }], '1', '1', '2025-01-01', now, 30)
    expect(result.dailyDemand).toBeNull()
  })
  it('rejects conflicting quantities for the same canonical item', () => {
    expect(calculateNetDemand([sale, { ...sale, quantity: 9 }], '1', '1', '2025-01-01', now, 30).dailyDemand).toBeNull()
  })
})
