import type { ErpData, SyncDataset } from '../../../shared/types/replenishment'

export interface SyncDatasetData {
  catalog: Pick<ErpData, 'products' | 'suppliers' | 'issues'>
  stock: Pick<ErpData, 'stocks'>
  sales: Pick<ErpData, 'sales' | 'historyFrom' | 'issues'>
  purchases: Pick<ErpData, 'purchases'>
}

export interface SyncSession {
  completed: Partial<SyncDatasetData>
  start: (dataset: SyncDataset) => Promise<void>
  save: <K extends SyncDataset>(dataset: K, data: SyncDatasetData[K]) => Promise<void>
}

/** Only translated business fields belong here; raw ERP responses and tokens never do. */
export interface SyncCheckpoint {
  version: 1
  scope: string
  createdAt: string
  completed: Partial<SyncDatasetData>
}

export const syncDatasets: SyncDataset[] = ['catalog', 'stock', 'sales', 'purchases']
// A short recovery window limits reuse of observations from a changing source.
export const checkpointLifetimeMs = 15 * 60_000

export function checkpointIsFresh(checkpoint: SyncCheckpoint | null | undefined, now = Date.now()): checkpoint is SyncCheckpoint {
  if (!checkpoint || checkpoint.version !== 1 || !checkpoint.completed || typeof checkpoint.scope !== 'string') return false
  const age = now - Date.parse(checkpoint.createdAt)
  return Number.isFinite(age) && age >= 0 && age < checkpointLifetimeMs
}
