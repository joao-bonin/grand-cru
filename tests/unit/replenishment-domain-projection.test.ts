import { describe, expect, it } from 'vitest'
import type { OpenPurchase } from '../../shared/types/replenishment'
import { projectStock } from '../../server/domain/replenishment/project-stock'
const now = new Date('2026-10-16T12:00:00-03:00')
const purchase: OpenPurchase = { id: 'o1', productId: '1', storeId: '1', quantity: 12, received: 6, cancelled: 0, arrival: '2026-10-18', status: 'open' }
const project = (purchases: OpenPurchase[], available = 1, demand = 1) => projectStock(available, demand, purchases, '1', '1', 17, now)
describe('CV-05 time-phased purchases', () => {
  it('uses only six outstanding units from a partially received order', () => {
    expect(project([purchase], 20).pending).toBe(6)
  })
  it('preserves first shortage when the receipt is later', () => {
    const result = project([{ ...purchase, quantity: 100, received: 0, arrival: '2026-10-25' }])
    expect(result.pending).toBe(100)
    expect(result.ruptureDate).toBe('2026-10-18')
  })
  it('applies timely receipt before later consumption, preventing a shortage', () => {
    expect(project([{ ...purchase, quantity: 30, received: 0, arrival: '2026-10-17' }], 2).ruptureDate).toBeNull()
  })
  it('applies an arrival before consuming demand on that same civil date', () => {
    expect(project([{ ...purchase, quantity: 30, received: 0, arrival: '2026-10-18' }], 1).ruptureDate).toBeNull()
  })
  it('does not erase a shortage that occurs on the preceding day', () => {
    expect(project([{ ...purchase, quantity: 30, received: 0, arrival: '2026-10-19' }], 1).ruptureDate).toBe('2026-10-18')
  })
  it('rejects conflicting observations of the same purchase identity', () => {
    expect(project([purchase, { ...purchase, quantity: 120 }], 20).issues).toContain('Identidade de compra com dados conflitantes')
  })
  it('flags aggregate purchase quantities outside finite numeric precision', () => {
    const result = project([{ ...purchase, quantity: Number.MAX_VALUE, received: 0 }, { ...purchase, id: 'o2', quantity: Number.MAX_VALUE, received: 0 }])
    expect(result.issues).toContain('Projeção excede a precisão numérica')
    expect(result.pending).toBe(0)
  })
  it('excludes local drafts, closed orders, other stores and arrivals beyond the horizon', () => {
    expect(project([{ ...purchase, status: 'draft' }, { ...purchase, status: 'closed' }, { ...purchase, storeId: '2' }, { ...purchase, productId: '2' }, { ...purchase, arrival: '2026-12-01' }], 20).pending).toBe(0)
  })
  it.each([{ arrival: null }, { arrival: '2026-02-30' }, { arrival: '2026-10-01' }, { quantity: NaN }, { received: -1 }, { received: 15 }, { status: 'unconfirmed' }])('flags unconfirmed arrival or invalid quantities %o', (change) => {
    const result = project([{ ...purchase, ...change }], 20)
    expect(result.pending).toBe(0)
    expect(result.issues.length).toBeGreaterThan(0)
  })
  it('deduplicates confirmed arrivals and subtracts cancellation separately', () => {
    expect(project([purchase, purchase, { ...purchase, id: 'o2', cancelled: 2 }], 20).pending).toBe(10)
  })
  it('keeps zero demand finite and indicates already negative availability', () => {
    expect(project([], 20, 0).ruptureDate).toBeNull()
    expect(project([], -1, 0).ruptureDate).toBe('2026-10-16')
  })
})
