export const dashboardSalesWindows = [30, 60, 90, 365] as const
export type DashboardSalesWindow = typeof dashboardSalesWindows[number]

export interface DashboardCoverage {
  count: number
  evaluated: number
  unavailable: number
}
export interface DashboardSummary {
  tracked: number
  calculable: number
  blocked: number
  replenishment: DashboardCoverage
  risk: DashboardCoverage
  excess: DashboardCoverage
}
export interface DashboardProduct {
  productId: string
  storeId: string
  description: string
  state: 'replenishment' | 'without_replenishment' | 'blocked'
  available: number | null
  minimum: number | null
  sales: Record<DashboardSalesWindow, { quantity: number | null, partial: boolean }>
  coverageDays: number | null
  ruptureDate: string | null
  riskEvaluated: boolean
  horizonDays: number | null
  suggested: number | null
  excess: number | null
  issues: string[]
}
export type BusinessDashboardReport = {
  state: 'awaiting_snapshot'
  snapshot: null
  summary: null
  items: DashboardProduct[]
  issues: string[]
} | {
  state: 'ready'
  snapshot: { id: string, createdAt: string }
  summary: DashboardSummary
  items: DashboardProduct[]
  issues: string[]
}
