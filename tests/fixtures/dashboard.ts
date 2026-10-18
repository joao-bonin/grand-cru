import { buildOperationalDashboard } from '../../shared/application/operational-dashboard'
import type { PurchaseDraft, Snapshot } from '../../shared/types/replenishment'
import { recommendation } from './replenishment'

export const dashboardSnapshot: Snapshot = {
  id: 'snapshot-1', createdAt: '2026-10-18T12:00:00Z',
  data: { products: [recommendation.product], stocks: [], sales: [], purchases: [], suppliers: [{ id: 'f1', name: 'Fornecedor exemplo', leadDays: 10 }], historyFrom: '2025-01-01', issues: [] },
}
export const dashboardDraft: PurchaseDraft = {
  id: 'draft-1', key: 'synthetic-key', author: 'ana', createdAt: '2026-10-18T13:00:00Z', snapshotId: 'snapshot-1', version: 1,
  state: 'draft', total: 240,
  items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', description: 'Vinho reserva', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }],
}
export const dashboardExample = () => buildOperationalDashboard(dashboardSnapshot, [recommendation], [dashboardDraft], 'success')
