import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { ErpSyncFailure } from '../../server/application/erp/sync-failure'
import type { ErpData } from '../../shared/types/replenishment'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Exige PostgreSQL local descartável.')
const pool = createDatabasePool(url)
const repository = createPurchasingRepository(pool)
test.afterAll(async () => { await pool.end() })

test('persists a safe source diagnosis and retains the previous complete snapshot', async () => {
  const data: ErpData = { products: [], suppliers: [], stocks: [], sales: [], purchases: [], historyFrom: null, issues: ['synthetic-snapshot-preserved'] }
  const previous = await repository.synchronize(async () => data)
  expect(previous.state).toBe('success')
  const beforeCount = (await pool.query('SELECT count(*)::int AS count FROM erp_snapshots')).rows[0].count
  const failed = await repository.synchronize(async () => { throw new ErpSyncFailure('stock', new Error('ERP_SYNC_DEADLINE')) })
  expect(failed.state).toBe('failed')
  expect(failed.snapshotId).toBe(previous.snapshotId)
  expect(failed.error).toBe('Falha na leitura de estoque: prazo da sincronização esgotado. A versão anterior foi preservada. [ERP_SYNC_DEADLINE]')
  expect((await repository.snapshot())?.data).toEqual(data)
  expect((await pool.query('SELECT count(*)::int AS count FROM erp_snapshots')).rows[0].count).toBe(beforeCount)
  const privateFailure = await repository.synchronize(async () => { throw new ErpSyncFailure('coupons', new Error('synthetic-private-token SELECT secret')) })
  expect(privateFailure.error).toBe('Falha na leitura de cupons de venda: dados retornados pelo ERP não puderam ser validados. A versão anterior foi preservada. [ERP_SOURCE_INVALID]')
  expect(privateFailure.snapshotId).toBe(previous.snapshotId)
})
