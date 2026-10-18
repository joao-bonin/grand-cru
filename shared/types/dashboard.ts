import type { SyncStatus } from './replenishment'

export interface DashboardProduct {
  productId: string
  storeId: string
  description: string
  supplier: string
  suggested: number
  ruptureDate: string | null
}

export interface DashboardRound {
  id: string
  createdAt: string
  state: 'draft' | 'reviewed'
  itemCount: number
  previousData: boolean
}

export interface OperationalDashboard {
  snapshot: { createdAt: string } | null
  synchronization: SyncStatus['state']
  products: {
    total: number
    ready: number
    pending: number
    withoutNeed: number
    uncalculated: number
    rupture: number
    unknownRisk: number
  } | null
  priorities: DashboardProduct[]
  rounds: {
    draft: number
    reviewed: number
    recent: DashboardRound[]
  }
}
