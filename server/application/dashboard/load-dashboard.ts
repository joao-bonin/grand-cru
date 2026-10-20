import type { Policy, Snapshot } from '../../../shared/types/replenishment'
import { buildBusinessDashboard } from '../../domain/dashboard/build-dashboard'

export interface DashboardSource {
  snapshot(): Promise<Snapshot | null>
  policies(): Promise<Policy[]>
}

export async function loadBusinessDashboard(source: DashboardSource) {
  const [snapshot, policies] = await Promise.all([source.snapshot(), source.policies()])
  return buildBusinessDashboard(snapshot, policies)
}
