import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { loadErpData } from '../../server/application/erp/synchronize'
import { checkpointLifetimeMs } from '../../server/application/erp/checkpoints'
import type { SyncSession } from '../../server/application/erp/checkpoints'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Exige PostgreSQL local descartável.')
if (process.env.ERP_ACCESS_TOKEN) throw new Error('Não execute testes de integração com token ERP configurado.')
const pool = createDatabasePool(url)
const repo = createPurchasingRepository(pool)
const emptyPage = { start: 0, count: 0, total: 0, items: [] }
function loader(calls: string[], failedPath?: string, error = 'synthetic-source-failure') {
  return (session: SyncSession) => loadErpData({
    async get(path) {
      calls.push(path)
      if (path === failedPath) throw new Error(error)
      return emptyPage
    },
  }, '1', Date.now, session)
}
test.afterAll(async () => { await pool.end() })

test('retoma conjuntos completos após recriar repositório e publica somente a carga final', async () => {
  const baseline = await repo.synchronize(loader([]))
  const scope = randomUUID()
  const firstCalls: string[] = []
  const failed = await repo.synchronize(loader(firstCalls, '/v1/estoque/saldos'), { scope })
  expect(firstCalls).toEqual(['/v1/produto/produtos', '/v1/pessoa/fornecedores', '/v1/estoque/saldos'])
  expect(failed.state).toBe('failed')
  expect(failed.snapshotId).toBe(baseline.snapshotId)
  expect((await repo.snapshot())!.id).toBe(baseline.snapshotId)
  expect(failed.progress).toEqual({ completed: ['catalog'], current: 'stock', resumable: true })
  expect(JSON.stringify(failed)).not.toContain(scope)
  expect(JSON.stringify(failed)).not.toContain('synthetic-source-failure')
  const restartedPool = createDatabasePool(url!)
  try {
    const restarted = createPurchasingRepository(restartedPool)
    const retryCalls: string[] = []
    const success = await restarted.synchronize(loader(retryCalls), { scope })
    expect(success.state).toBe('success')
    expect(success.id).toBe(failed.id)
    expect(success.snapshotId).not.toBe(baseline.snapshotId)
    expect(retryCalls).toEqual(['/v1/estoque/saldos', '/v1/venda/cupons-fiscais', '/v1/pdv/trocas-devolucoes', '/v1/compra/pedidos'])
    expect((await pool.query('SELECT checkpoint FROM erp_sync WHERE source=$1', ['varejofacil'])).rows[0].checkpoint).toBeNull()
    const freshCalls: string[] = []
    await restarted.synchronize(loader(freshCalls), { scope })
    expect(freshCalls).toHaveLength(6)
  } finally { await restartedPool.end() }
})

test('descarta progresso expirado ou pertencente a outra loja/credencial', async () => {
  for (const reason of ['expired', 'scope'] as const) {
    const scope = randomUUID()
    await repo.synchronize(loader([], '/v1/estoque/saldos'), { scope })
    if (reason === 'expired') {
      const expiredAt = new Date(Date.now() - checkpointLifetimeMs - 1000).toISOString()
      await pool.query('UPDATE erp_sync SET checkpoint=jsonb_set(checkpoint,\'{createdAt}\',to_jsonb($1::text)) WHERE source=$2', [expiredAt, 'varejofacil'])
      expect((await repo.status()).progress?.resumable).toBe(false)
    }
    const calls: string[] = []
    const success = await repo.synchronize(loader(calls), { scope: reason === 'scope' ? randomUUID() : scope })
    expect(success.state).toBe('success')
    expect(calls).toHaveLength(6)
  }
})

test('falha de autenticação encerra a leitura sem reaproveitar progresso anterior', async () => {
  const scope = randomUUID()
  const baseline = await repo.status()
  const failed = await repo.synchronize(loader([], '/v1/estoque/saldos', 'ERP_AUTHENTICATION_PENDING'), { scope })
  expect(failed.error).toBe('ERP_AUTHENTICATION_PENDING')
  expect(failed.snapshotId).toBe(baseline.snapshotId)
  expect(failed.progress?.resumable).toBe(false)
  const calls: string[] = []
  expect((await repo.synchronize(loader(calls), { scope })).state).toBe('success')
  expect(calls).toHaveLength(6)
})

test('reconhece execução abandonada e libera a retomada sem roubar execução ativa', async () => {
  const scope = randomUUID()
  const failed = await repo.synchronize(loader([], '/v1/estoque/saldos'), { scope })
  await pool.query(`UPDATE erp_sync SET state='running',finished_at=null,error=null WHERE source=$1`, ['varejofacil'])
  const owner = await pool.connect()
  try {
    await owner.query('SELECT pg_advisory_lock(72641016)')
    expect((await repo.status()).state).toBe('running')
    let duplicate = false
    const concurrent = await repo.synchronize(async session => { duplicate = true; return loader([])(session) }, { scope })
    expect(concurrent.state).toBe('running')
    expect(duplicate).toBe(false)
  } finally {
    await owner.query('SELECT pg_advisory_unlock(72641016)')
    owner.release()
  }
  const recovered = await repo.status()
  expect(recovered.state).toBe('failed')
  expect(recovered.id).toBe(failed.id)
  expect(recovered.progress?.resumable).toBe(true)
  const calls: string[] = []
  expect((await repo.synchronize(loader(calls), { scope })).state).toBe('success')
  expect(calls).toHaveLength(4)
})
