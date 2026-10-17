import { describe, expect, it } from 'vitest'
import type { Policy, Snapshot } from '../../shared/types/replenishment'
import { buildRecommendations } from '../../server/domain/replenishment/recommend'
const now = new Date('2026-10-16T12:00:00-03:00')
const policy: Policy = { productId: '1', storeId: '1', supplierId: 'supplier', windowDays: 30, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: 20, version: 1 }
function snapshot(): Snapshot {
  return { id: 'version-1', createdAt: now.toISOString(), data: {
    products: [{ id: '1', description: 'Wine', supplierId: 'supplier', purchaseUnit: 'CX', packSize: 6, minimum: 0, cost: 20, storeId: '1' }],
    stocks: [{ productId: '1', storeId: '1', locationId: '1', physical: 16, reserved: 0, blocked: 0, disjoint: true, updatedAt: now.toISOString() }],
    sales: [{ id: 'sale', documentId: 'coupon', productId: '1', storeId: '1', date: '2026-10-15', quantity: 30, kind: 'sale', cancelled: false, originalSaleId: null }],
    purchases: [], suppliers: [{ id: 'supplier', name: 'Supplier', leadDays: 10 }], historyFrom: '2025-01-01', issues: [],
  } }
}
describe('CV-06 explicit and explainable replenishment', () => {
  it('computes the spec example raw seven, twelve units and two packages with each calculation operand', () => {
    const result = buildRecommendations(snapshot(), [policy], now)[0]!
    expect(result).toMatchObject({ snapshotId: 'version-1', available: 16, dailyDemand: 1, pending: 0, target: 23, raw: 7, suggested: 12, packages: 2, coverageDays: 16, excess: 0, turnover: null, policy, issues: [] })
    expect(result.sales['30']).toEqual({ quantity: 30, partial: false })
  })
  it('does not invent business parameters when policy is absent or invalid', () => {
    expect(buildRecommendations(snapshot(), [], now)[0]).toMatchObject({ policy: null, suggested: null, raw: null, dailyDemand: null })
    expect(buildRecommendations(snapshot(), [{ ...policy, packSize: 0 }], now)[0]!.suggested).toBeNull()
  })
  it.each(['history', 'availability', 'source'])('keeps suggestion unknown for unconfirmed %s', (field) => {
    const input = snapshot()
    if (field === 'history') input.data.historyFrom = null
    if (field === 'availability') input.data.stocks[0]!.reserved = null
    if (field === 'source') input.data.issues = ['RETURNS_RECONCILIATION_UNCONFIRMED']
    const result = buildRecommendations(input, [policy], now)[0]!
    expect(result.suggested).toBeNull()
    expect(result.issues.length).toBeGreaterThan(0)
  })
  it('keeps zero consumption valid without infinite coverage or an invented turnover', () => {
    const input = snapshot()
    input.data.sales = []
    expect(buildRecommendations(input, [{ ...policy, safetyUnits: 0 }], now)[0]).toMatchObject({ dailyDemand: 0, coverageDays: null, turnover: null, suggested: 0, excess: 16 })
  })
  it('counts timely outstanding quantity, without hiding an earlier shortage', () => {
    const input = snapshot()
    input.data.stocks[0]!.physical = 1
    input.data.purchases = [{ id: 'o', storeId: '1', productId: '1', quantity: 12, received: 6, cancelled: 0, arrival: '2026-10-25', status: 'open' }]
    expect(buildRecommendations(input, [policy], now)[0]).toMatchObject({ pending: 6, raw: 16, suggested: 18, ruptureDate: '2026-10-18' })
  })
  it('blocks a suggestion for an unconfirmed purchase instead of treating it as zero safely', () => {
    const input = snapshot()
    input.data.purchases = [{ id: 'o', storeId: '1', productId: '1', quantity: 12, received: 6, cancelled: 0, arrival: null, status: 'open' }]
    expect(buildRecommendations(input, [policy], now)[0]!.suggested).toBeNull()
  })
  it('blocks nonfinite calculation results even when individual source values are finite', () => {
    const input = snapshot()
    input.data.sales[0]!.quantity = Number.MAX_VALUE
    const result = buildRecommendations(input, [{ ...policy, safetyUnits: Number.MAX_VALUE }], now)[0]!
    expect(result.suggested).toBeNull()
    expect(result.target).toBeNull()
    expect(result.raw).toBeNull()
    expect(result.packages).toBeNull()
    expect(result.issues).toContain('Cálculo excede a precisão numérica')
  })
  it('keeps identities and policies separate across stores and duplicate descriptions', () => {
    const input = snapshot()
    input.data.products.push({ ...input.data.products[0]!, id: '2' }, { ...input.data.products[0]!, storeId: '2' })
    const result = buildRecommendations(input, [policy], now)
    expect(result.map(item => [item.product.id, item.product.storeId, item.suggested])).toEqual([['1', '1', 12], ['2', '1', null], ['1', '2', null]])
  })
})

it('keeps a manual supplier reference pending when its identity is absent from the source', () => {
  const result = buildRecommendations(snapshot(), [{ ...policy, supplierId: 'missing' }], now)[0]!
  expect(result.suggested).toBeNull()
  expect(result.issues).toContain('Fornecedor configurado não encontrado na fonte')
})


it('pendência de compra de outro SKU não bloqueia um produto válido', () => {
  const input = snapshot()
  input.data.issues = ['PRODUCT_PURCHASE_PARAMETERS_MISSING:other']
  input.data.products.push({ ...input.data.products[0]!, id: 'other', supplierId: null })
  const result = buildRecommendations(input, [policy], now)
  expect(result[0]!.suggested).toBe(12)
  expect(result[0]!.issues).toEqual([])
  expect(result[1]!.suggested).toBeNull()
  expect(result[1]!.issues).toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING:other')
})
