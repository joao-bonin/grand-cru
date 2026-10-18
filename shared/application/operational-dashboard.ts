import { isActionableRecommendation, queryRecommendations } from './replenishment-query'
import type { OperationalDashboard } from '../types/dashboard'
import type { PurchaseDraft, Recommendation, Snapshot, SyncStatus } from '../types/replenishment'

/** Counts always use the complete snapshot, independently of list pagination. */
export function buildOperationalDashboard(
  snapshot: Snapshot | null,
  recommendations: Recommendation[],
  drafts: PurchaseDraft[],
  synchronization: SyncStatus['state'],
): OperationalDashboard {
  const items = snapshot ? recommendations : []
  const priorities = queryRecommendations(items, { actionable: true, count: 5 }).items
  return {
    snapshot: snapshot ? { createdAt: snapshot.createdAt } : null,
    synchronization,
    products: snapshot ? {
      total: items.length,
      ready: items.filter(isActionableRecommendation).length,
      pending: items.filter(item => item.issues.length > 0).length,
      withoutNeed: items.filter(item => item.suggested === 0 && item.issues.length === 0).length,
      uncalculated: items.filter(item => item.suggested === null).length,
      rupture: items.filter(item => item.ruptureDate !== null).length,
      unknownRisk: items.filter(item => item.ruptureDate === null && (item.issues.length > 0 || item.policy === null || item.dailyDemand === null || item.available === null)).length,
    } : null,
    priorities: priorities.map(item => ({
      productId: item.product.id,
      storeId: item.product.storeId,
      description: item.product.description,
      supplier: snapshot!.data.suppliers.find(supplier => supplier.id === item.policy?.supplierId)?.name ?? 'Fornecedor não identificado',
      suggested: item.suggested!,
      ruptureDate: item.ruptureDate,
    })),
    rounds: {
      draft: drafts.filter(draft => draft.state === 'draft').length,
      reviewed: drafts.filter(draft => draft.state === 'reviewed').length,
      recent: [...drafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).map(draft => ({
        id: draft.id,
        createdAt: draft.createdAt,
        state: draft.state,
        itemCount: draft.items.length,
        previousData: draft.snapshotId !== snapshot?.id,
      })),
    },
  }
}
