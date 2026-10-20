import { dashboardSalesWindows } from '../../../shared/types/dashboard'
import type { BusinessDashboardReport, DashboardCoverage, DashboardProduct } from '../../../shared/types/dashboard'
import type { Policy, Snapshot } from '../../../shared/types/replenishment'
import { buildRecommendations } from '../replenishment/recommend'

const finite = (value: number | null | undefined) => value !== null && value !== undefined && Number.isFinite(value) ? value : null
const identity = (product: { productId: string, storeId: string }) => JSON.stringify([product.storeId, product.productId])

export function buildBusinessDashboard(snapshot: Snapshot | null, policies: Policy[]): BusinessDashboardReport {
  if (!snapshot) return { state: 'awaiting_snapshot', snapshot: null, summary: null, items: [], issues: [] }
  const reference = new Date(snapshot.createdAt)
  if (!Number.isFinite(reference.getTime())) throw new Error('Data da versão de estoque inválida.')

  const grouped = new Map<string, DashboardProduct>()
  for (const recommendation of buildRecommendations(snapshot, policies, reference)) {
    const { product, policy } = recommendation
    const suggested = finite(recommendation.suggested)
    const calculable = recommendation.issues.length === 0 && suggested !== null && suggested >= 0
    const item: DashboardProduct = {
      productId: product.id, storeId: product.storeId, description: product.description,
      state: calculable ? (suggested > 0 ? 'replenishment' : 'without_replenishment') : 'blocked',
      available: finite(recommendation.available), minimum: finite(policy?.minimum ?? product.minimum),
      sales: Object.fromEntries(dashboardSalesWindows.map((days) => {
        const window = recommendation.sales[String(days)]
        return [days, { quantity: finite(window?.quantity), partial: !window || window.partial || snapshot.data.issues.length > 0 }]
      })) as DashboardProduct['sales'],
      coverageDays: calculable ? finite(recommendation.coverageDays) : null,
      ruptureDate: calculable ? recommendation.ruptureDate : null,
      riskEvaluated: calculable,
      horizonDays: policy ? policy.leadDays + policy.reviewDays : null,
      suggested: calculable ? suggested : null,
      excess: calculable ? finite(recommendation.excess) : null,
      issues: [...recommendation.issues],
    }
    const key = identity(item)
    const previous = grouped.get(key)
    if (previous) {
      // A duplicated identity cannot establish which source row is authoritative.
      grouped.set(key, { ...previous, state: 'blocked', available: null, minimum: null,
        sales: Object.fromEntries(dashboardSalesWindows.map(days => [days, { quantity: null, partial: true }])) as DashboardProduct['sales'],
        coverageDays: null, ruptureDate: null, riskEvaluated: false, suggested: null, excess: null,
        issues: [...new Set([...previous.issues, ...item.issues, 'Produto duplicado na mesma loja.'])] })
    } else grouped.set(key, item)
  }
  const priority = (item: DashboardProduct) => item.ruptureDate ? 0 : item.state === 'replenishment' ? 1 : item.state === 'blocked' ? 2 : 3
  const items = [...grouped.values()].sort((a, b) => priority(a) - priority(b)
    || (a.ruptureDate ?? '').localeCompare(b.ruptureDate ?? '') || a.description.localeCompare(b.description, 'pt-BR')
    || a.storeId.localeCompare(b.storeId) || a.productId.localeCompare(b.productId))
  const coverage = (evaluates: (item: DashboardProduct) => boolean, matches: (item: DashboardProduct) => boolean): DashboardCoverage => {
    const evaluated = items.filter(evaluates)
    return { count: evaluated.filter(matches).length, evaluated: evaluated.length, unavailable: items.length - evaluated.length }
  }
  const calculable = items.filter(item => item.state !== 'blocked').length
  return {
    state: 'ready', snapshot: { id: snapshot.id, createdAt: snapshot.createdAt }, items, issues: snapshot.data.issues,
    summary: {
      tracked: items.length, calculable, blocked: items.length - calculable,
      replenishment: coverage(item => item.suggested !== null, item => item.suggested! > 0),
      risk: coverage(item => item.riskEvaluated, item => item.ruptureDate !== null),
      excess: coverage(item => item.excess !== null, item => item.excess! > 0),
    },
  }
}
