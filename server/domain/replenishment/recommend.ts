import type { Policy, Recommendation, Snapshot } from '../../../shared/types/replenishment'
import { calculateAvailability } from './availability'
import { calculateNetDemand } from './net-demand'
import { validatePolicy } from './policy'
import { projectStock } from './project-stock'

export function buildRecommendations(snapshot: Snapshot, policies: Policy[], now = new Date()): Recommendation[] {
  return snapshot.data.products.map((product) => {
    const sourceIssues = snapshot.data.issues.filter(issue => !issue.startsWith('PRODUCT_PURCHASE_PARAMETERS_MISSING:') || issue === `PRODUCT_PURCHASE_PARAMETERS_MISSING:${product.id}`)
    const issues = [...sourceIssues]
    let policy: Policy | null = null
    const configured = policies.find(item => item.productId === product.id && item.storeId === product.storeId)
    try {
      if (!configured) throw new Error('Política de reposição não configurada')
      policy = validatePolicy(configured)
      if (!snapshot.data.suppliers.some(supplier => supplier.id === policy!.supplierId)) issues.push('Fornecedor configurado não encontrado na fonte')
    } catch (error) {
      issues.push(error instanceof Error ? error.message : 'Política inválida')
    }
    const stock = calculateAvailability(snapshot.data.stocks, product.id, product.storeId)
    // Without a policy the four fixed windows remain visible, but no window is silently selected for demand.
    const demand = calculateNetDemand(snapshot.data.sales, product.id, product.storeId, snapshot.data.historyFrom, now, policy?.windowDays ?? 30)
    issues.push(...stock.issues, ...demand.issues)
    const dailyDemand = policy && sourceIssues.length === 0 ? demand.dailyDemand : null
    const available = stock.available
    const projection = policy && dailyDemand !== null && available !== null
      ? projectStock(available, dailyDemand, snapshot.data.purchases, product.id, product.storeId, policy.leadDays + policy.reviewDays, now)
      : { pending: 0, ruptureDate: null, issues: [] }
    issues.push(...projection.issues)
    const computable = policy !== null && dailyDemand !== null && available !== null && issues.length === 0
    let target = computable && policy && dailyDemand !== null ? Math.max(policy.minimum, dailyDemand * (policy.leadDays + policy.reviewDays) + policy.safetyUnits) : null
    let raw = target !== null && available !== null ? Math.max(0, target - available - projection.pending) : null
    let packages = raw !== null && policy ? Math.ceil(raw / policy.packSize) : null
    let suggested = packages !== null && policy ? packages * policy.packSize : null
    if ([target, raw, packages, suggested].some(value => value !== null && !Number.isFinite(value))) {
      issues.push('Cálculo excede a precisão numérica')
      target = raw = packages = suggested = null
    }
    return {
      product, snapshotId: snapshot.id, available, dailyDemand, sales: demand.windows,
      coverageDays: available !== null && dailyDemand !== null && dailyDemand > 0 ? Math.max(0, available / dailyDemand) : null,
      ruptureDate: projection.ruptureDate, pending: projection.pending, target, raw, suggested, packages,
      excess: target !== null && available !== null ? Math.max(0, available - target) : null,
      turnover: null, policy, issues: [...new Set(issues)],
    }
  })
}
