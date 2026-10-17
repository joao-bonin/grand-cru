import { describe, expect, it } from 'vitest'
import type { Stock } from '../../shared/types/replenishment'
import { calculateAvailability } from '../../server/domain/replenishment/availability'

const stock: Stock = { productId: '1', storeId: '1', locationId: '1', physical: 20, reserved: 4, blocked: 2, disjoint: true, updatedAt: null }
describe('CV-05 availability without double deductions', () => {
  it('calculates twenty less four reserved less two disjoint blocked as fourteen', () => {
    expect(calculateAvailability([stock], '1', '1')).toEqual({ available: 14, issues: [] })
  })
  it.each([{ reserved: null }, { blocked: null }, { disjoint: false }, { physical: NaN }])('marks unknown stock semantics as indeterminate %o', (change) => {
    expect(calculateAvailability([{ ...stock, ...change }], '1', '1').available).toBeNull()
  })
  it('does not presume zero stock when source is absent', () => {
    expect(calculateAvailability([], '1', '1').available).toBeNull()
  })
  it('totals distinct locations without mixing stores or products', () => {
    expect(calculateAvailability([stock, stock, { ...stock, locationId: '2', physical: 10, reserved: 0, blocked: 0 }, { ...stock, storeId: '2' }, { ...stock, productId: '2' }], '1', '1').available).toBe(24)
  })
})

it('rejects contradictory observations of the same stock location', () => {
  expect(calculateAvailability([stock, { ...stock, physical: 100 }], '1', '1').available).toBeNull()
})
