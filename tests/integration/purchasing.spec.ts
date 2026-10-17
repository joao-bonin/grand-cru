import { randomUUID, randomBytes } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createUserRepository } from '../../server/db/repository'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { hashPassword } from '../../server/services/passwords'
import type { ErpData, Policy } from '../../shared/types/replenishment'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Exige PostgreSQL local descartável.')
if (process.env.ERP_ACCESS_TOKEN) throw new Error('Não execute testes de integração com token ERP configurado.')
const pool = createDatabasePool(url)
const repo = createPurchasingRepository(pool)
const users = createUserRepository(url)
const prefix = `purchase-${randomUUID().slice(0, 8)}`
const password = randomBytes(24).toString('hex')
const policy: Policy = { productId: 'sku', storeId: prefix, windowDays: 30, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, supplierId: 'supplier', cost: 10, version: 0 }
function data(): ErpData {
  const now = new Date()
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString()
  return { products: [{ id: 'sku', storeId: prefix, description: 'Vinho de teste', supplierId: 'supplier', purchaseUnit: 'CX', packSize: 6, minimum: 0, cost: 10 }],
    stocks: [{ productId: 'sku', storeId: prefix, locationId: '1', physical: 16, reserved: 0, blocked: 0, disjoint: true, updatedAt: now.toISOString() }],
    sales: Array.from({ length: 30 }, (_, n) => ({ id: `sale-${n}`, documentId: `sale-${n}`, productId: 'sku', storeId: prefix, date: day(n + 1), quantity: 1, kind: 'sale', cancelled: false, originalSaleId: null })),
    purchases: [], suppliers: [{ id: 'supplier', name: 'Fornecedor', leadDays: 10 }], historyFrom: day(366), issues: [] }
}
let adminId: string
let memberId: string

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password)
  adminId = (await users.create({ login: `${prefix}-admin`, passwordHash, role: 'admin', active: true })).id
  memberId = (await users.create({ login: `${prefix}-member`, passwordHash, role: 'user', active: true })).id
})
test.afterAll(async () => {
  await pool.query('DELETE FROM purchase_drafts WHERE data->>\'author\'=$1', [adminId])
  await pool.query('DELETE FROM replenishment_policies WHERE data->>\'storeId\'=$1', [prefix])
  await pool.query('DELETE FROM users WHERE id=ANY($1)', [[adminId, memberId]])
  await users.close(); await pool.end()
})

test('snapshot atômico, repetição e falha preservam a versão válida', async () => {
  const first = await repo.synchronize(async () => data())
  expect(first.state).toBe('success')
  expect((await repo.snapshot())!.data.products[0]!.id).toBe('sku')
  const second = await repo.synchronize(async () => data())
  expect(second.state).toBe('success')
  expect((await repo.snapshot())!.data.sales).toHaveLength(30)
  const failed = await repo.synchronize(async () => { throw new Error('secret-test-must-not-leak') })
  expect(failed.state).toBe('failed')
  expect(failed.snapshotId).toBe(second.snapshotId)
  expect(failed.error).not.toContain('secret-test-must-not-leak')
  expect((await repo.snapshot())!.id).toBe(second.snapshotId)
  const authenticationFailed = await repo.synchronize(async () => { throw new Error('ERP_AUTHENTICATION_PENDING') })
  expect(authenticationFailed.state).toBe('failed')
  expect(authenticationFailed.error).toBe('ERP_AUTHENTICATION_PENDING')
  expect(authenticationFailed.snapshotId).toBe(second.snapshotId)
})

test('lock persistido impede carga concorrente e libera após término', async () => {
  let release!: () => void
  let started!: () => void
  const entered = new Promise<void>(r => { started = r })
  const gate = new Promise<void>(r => { release = r })
  const first = repo.synchronize(async () => { started(); await gate; return data() })
  await entered
  let duplicated = false
  const concurrent = await repo.synchronize(async () => { duplicated = true; return data() })
  expect(concurrent.state).toBe('running')
  expect(duplicated).toBe(false)
  release()
  expect((await first).state).toBe('success')
  expect((await repo.synchronize(async () => data())).state).toBe('success')
})

test('políticas versionadas persistem e rejeitam concorrência obsoleta', async () => {
  const saved = await repo.savePolicy(policy)
  expect(saved.version).toBe(1)
  await expect(repo.savePolicy(policy)).rejects.toMatchObject({ statusCode: 409 })
  const again = createPurchasingRepository(pool)
  expect((await again.policies()).find(p => p.storeId === prefix)).toEqual(saved)
})

