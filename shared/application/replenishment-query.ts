import type { Recommendation } from '../types/replenishment'

export interface RecommendationQuery {
  product?: string
  supplier?: string
  risk?: boolean
  issues?: boolean
  start?: number
  count?: number
}

/** Filters and ordering apply before slicing, so every page searches the full snapshot. */
export function queryRecommendations(items: Recommendation[], query: RecommendationQuery) {
  const supplierIds = [...new Set(items.map(item => item.policy?.supplierId ?? item.product.supplierId).filter((id): id is string => !!id))].sort()
  const product = query.product?.trim().toLowerCase()
  const filtered = items.filter(item => (!product || `${item.product.id} ${item.product.description}`.toLowerCase().includes(product))
    && (!query.supplier || (item.policy?.supplierId ?? item.product.supplierId) === query.supplier)
    && (query.risk === undefined || Boolean(item.ruptureDate) === query.risk)
    && (query.issues === undefined || Boolean(item.issues.length) === query.issues))
    .sort((a, b) => (a.ruptureDate ?? '9999').localeCompare(b.ruptureDate ?? '9999') || a.product.id.localeCompare(b.product.id) || a.product.storeId.localeCompare(b.product.storeId))
  const start = query.start ?? 0
  const count = query.count ?? filtered.length
  return { items: filtered.slice(start, start + count), start, count, total: filtered.length, supplierIds }
}
