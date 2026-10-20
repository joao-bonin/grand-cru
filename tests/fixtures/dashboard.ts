import type { Policy, Snapshot } from '../../shared/types/replenishment'

export const dashboardPolicy: Policy = { productId: 'wine', storeId: 'store-a', supplierId: 'supplier', windowDays: 30, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: 20, version: 1 }
export function dashboardSnapshot(): Snapshot {
  return { id: 'dashboard-version', createdAt: '2026-10-16T15:00:00Z', data: {
    products: [{ id: 'wine', description: 'Vinho reserva', supplierId: 'supplier', purchaseUnit: 'CX', packSize: 6, minimum: 0, cost: 20, storeId: 'store-a' }],
    stocks: [{ productId: 'wine', storeId: 'store-a', locationId: 'main', physical: 16, reserved: 0, blocked: 0, disjoint: true, updatedAt: '2026-10-16T15:00:00Z' }],
    sales: [{ id: 'sale', documentId: 'coupon', productId: 'wine', storeId: 'store-a', date: '2026-10-15', quantity: 30, kind: 'sale', cancelled: false, originalSaleId: null }],
    purchases: [], suppliers: [{ id: 'supplier', name: 'Fornecedor de teste', leadDays: 10 }], historyFrom: '2025-01-01', issues: [],
  } }
}
