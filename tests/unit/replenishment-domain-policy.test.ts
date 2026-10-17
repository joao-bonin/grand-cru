import { describe, expect, it } from 'vitest'
import { validatePolicy } from '../../server/domain/replenishment/policy'

const valid = { productId: '1', storeId: '1', supplierId: '2', windowDays: 60, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: null, version: 0 }
describe('CV-03 explicit replenishment policy', () => {
  it('preserves explicit zeroes, units and identity without ERP defaults', () => {
    expect(validatePolicy(valid)).toEqual(valid)
  })
  it.each(['windowDays', 'leadDays', 'reviewDays', 'safetyUnits', 'minimum', 'packSize', 'supplierId'])('rejects missing %s', (field) => {
    const input = Object.fromEntries(Object.entries(valid).filter(([key]) => key !== field))
    expect(() => validatePolicy(input)).toThrow()
  })
  it.each([{ leadDays: -1 }, { safetyUnits: Infinity }, { windowDays: 0 }, { packSize: 0 }, { packSize: 1.5 }, { cost: -1 }, { version: -1 }, { supplierId: '' }])('rejects invalid parameter %o', (change) => {
    expect(() => validatePolicy({ ...valid, ...change })).toThrow()
  })
})

it('rejects temporal parameters exceeding the documented ten-year operational bound', () => {
  for (const field of ['windowDays', 'leadDays', 'reviewDays']) expect(() => validatePolicy({ ...valid, [field]: 3651 })).toThrow()
})
