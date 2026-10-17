export interface Product {
  id: string
  description: string
  supplierId: string | null
  purchaseUnit: string | null
  packSize: number | null
  minimum: number | null
  cost: number | null
  storeId: string
}
export interface Stock {
  productId: string
  storeId: string
  locationId: string
  physical: number
  reserved: number | null
  blocked: number | null
  disjoint: boolean
  updatedAt: string | null
}
export interface Sale {
  id: string
  documentId: string
  productId: string
  storeId: string
  date: string
  quantity: number
  kind: 'sale' | 'return'
  cancelled: boolean
  originalSaleId: string | null
}
export interface OpenPurchase {
  id: string
  productId: string
  storeId: string
  quantity: number
  received: number
  cancelled: number
  arrival: string | null
  status: string
}
export interface Supplier { id: string, name: string, leadDays: number | null }
export interface Policy {
  productId: string
  storeId: string
  windowDays: number
  leadDays: number
  reviewDays: number
  safetyUnits: number
  minimum: number
  packSize: number
  cost: number | null
  supplierId: string
  version: number
}
export interface ErpData {
  products: Product[]
  stocks: Stock[]
  sales: Sale[]
  purchases: OpenPurchase[]
  suppliers: Supplier[]
  historyFrom: string | null
  issues: string[]
}
export interface Snapshot { id: string, createdAt: string, data: ErpData }
export interface SyncStatus { id: string | null, state: 'idle' | 'running' | 'success' | 'failed', startedAt: string | null, finishedAt: string | null, error: string | null, snapshotId: string | null }
export interface Recommendation {
  product: Product
  snapshotId: string
  available: number | null
  dailyDemand: number | null
  sales: Record<string, { quantity: number, partial: boolean }>
  coverageDays: number | null
  ruptureDate: string | null
  pending: number
  target: number | null
  raw: number | null
  suggested: number | null
  packages: number | null
  excess: number | null
  turnover: number | null
  policy: Policy | null
  issues: string[]
}
export interface DraftItem { productId: string, storeId: string, supplierId: string, description: string, suggested: number, adjusted: number, packSize: number, unitCost: number | null, policyVersion: number, reference?: Recommendation }
export interface PurchaseDraft { id: string, key: string, author: string, createdAt: string, snapshotId: string, version: number, state: 'draft' | 'reviewed', items: DraftItem[], total: number | null }
