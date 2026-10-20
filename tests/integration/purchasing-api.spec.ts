import { randomUUID, randomBytes } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createUserRepository } from '../../server/db/repository'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { hashPassword } from '../../server/services/passwords'
import type { ErpData, Policy, PurchaseDraft } from '../../shared/types/replenishment'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Exige PostgreSQL local descartável.')
if (process.env.ERP_ACCESS_TOKEN) throw new Error('Não execute testes de integração com token ERP configurado.')
const pool = createDatabasePool(url)
const repo = createPurchasingRepository(pool)
const users = createUserRepository(url)
const prefix = `purchase-${randomUUID().slice(0, 8)}`
const password = randomBytes(24).toString('hex')
const headers = { Origin: 'http://127.0.0.1:3000' }
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
  await repo.synchronize(async () => data())
  await repo.savePolicy(policy)
})
test.afterAll(async () => {
  await pool.query('DELETE FROM purchase_drafts WHERE data->>\'author\'=$1', [adminId])
  await pool.query('DELETE FROM replenishment_policies WHERE data->>\'storeId\'=$1', [prefix])
  await pool.query('DELETE FROM users WHERE id=ANY($1)', [[adminId, memberId]])
  await users.close(); await pool.end()
})

test('rotas protegidas e revisão local completa com dados sintéticos', async ({ playwright }) => {
  const admin = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000', extraHTTPHeaders: headers })
  const regular = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000', extraHTTPHeaders: headers })
  const anonymous = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000' })
  try {
    for (const endpoint of ['/api/erp/status', '/api/replenishment', '/api/purchase-drafts', '/api/dashboard']) expect((await anonymous.get(endpoint)).status()).toBe(401)
    expect((await anonymous.post('/api/erp/sync', { headers })).status()).toBe(401)
    expect((await admin.post('/api/auth/login', { data: { login: `${prefix}-admin`, password } })).status()).toBe(200)
    expect((await regular.post('/api/auth/login', { data: { login: `${prefix}-member`, password } })).status()).toBe(200)
    expect((await regular.post('/api/erp/sync')).status()).toBe(403)
    expect((await regular.put('/api/replenishment/policies/sku', { data: policy })).status()).toBe(403)
    expect((await regular.post('/api/purchase-drafts', { data: {} })).status()).toBe(403)
    expect((await admin.post('/api/erp/sync', { headers: { Origin: 'https://wrong.invalid' } })).status()).toBe(403)
    // No ERP token is configured in this server: this call must stop before any outbound call.
    expect((await admin.post('/api/erp/sync')).status()).toBe(503)
    const status = await (await admin.get('/api/erp/status')).json()
    expect(status.configured).toBe(false)
    expect(status).not.toHaveProperty('token')
    expect((await admin.put('/api/replenishment/policies/sku', { data: { ...policy, windowDays: 0 } })).status()).toBe(400)
    const savedPolicy = await admin.put('/api/replenishment/policies/sku', { data: { ...policy, version: 1 } })
    expect(savedPolicy.status()).toBe(200)
    expect((await savedPolicy.json()).policy.version).toBe(2)
    expect((await admin.put('/api/replenishment/policies/sku', { data: { ...policy, version: 1 } })).status()).toBe(409)
    const source = await (await regular.get('/api/replenishment')).json()
    expect(source.items[0].suggested).toBe(12)
    expect(source.items[0].raw).toBe(7)
    const dashboardResponse = await regular.get('/api/dashboard')
    expect(dashboardResponse.status()).toBe(200)
    const dashboard = await dashboardResponse.json()
    expect(dashboard).toMatchObject({ state: 'ready', snapshot: { id: source.snapshotId }, summary: { tracked: 1, calculable: 1, blocked: 0, replenishment: { count: 1, evaluated: 1, unavailable: 0 } } })
    expect(dashboard.items[0]).toMatchObject({ productId: 'sku', storeId: prefix, available: 16, suggested: 12, state: 'replenishment' })
    expect((await (await admin.get('/api/dashboard')).json()).snapshot.id).toBe(source.snapshotId)
    expect((await (await regular.get('/api/replenishment', { params: { product: 'inexistente' } })).json()).total).toBe(0)
    expect((await (await regular.get('/api/replenishment', { params: { start: 1, count: 1 } })).json()).items).toEqual([])
    expect((await regular.get('/api/replenishment', { params: { count: -1 } })).status()).toBe(400)
    expect((await admin.post('/api/purchase-drafts', { data: { key: randomUUID(), snapshotId: source.snapshotId, state: 'reviewed', items: [{ productId: 'sku', storeId: prefix, adjusted: 18, expectedPolicyVersion: 1 }] } })).status()).toBe(409)
    const command = { key: randomUUID(), snapshotId: source.snapshotId, state: 'reviewed', items: [{ productId: 'sku', storeId: prefix, adjusted: 18, expectedPolicyVersion: 2 }] }
    const first = await admin.post('/api/purchase-drafts', { data: command })
    expect(first.status()).toBe(200)
    const draft = (await first.json()).draft as PurchaseDraft
    expect(draft.items[0]!.suggested).toBe(12)
    expect(draft.items[0]!.adjusted).toBe(18)
    expect(draft.total).toBe(180)
    const afterDraft = await (await admin.get('/api/replenishment')).json()
    expect(afterDraft.items[0].suggested).toBe(12)
    expect(afterDraft.items[0].pending).toBe(0)
    expect((await (await admin.get('/api/purchase-drafts', { params: { id: draft.id } })).json()).drafts[0].items[0].reference.policy.version).toBe(2)
    expect((await admin.get('/api/purchase-drafts', { params: { id: 'invalid' } })).status()).toBe(400)
    expect((await admin.get('/api/purchase-drafts', { params: { id: randomUUID() } })).status()).toBe(404)
    const repeated = await admin.post('/api/purchase-drafts', { data: command })
    expect(repeated.status()).toBe(200)
    expect((await repeated.json()).draft.id).toBe(draft.id)
    expect((await admin.post('/api/purchase-drafts', { data: { ...command, items: [{ ...command.items[0], adjusted: -1 }] } })).status()).toBe(400)
    expect((await admin.post('/api/purchase-drafts', { data: { ...command, key: randomUUID(), id: draft.id, version: 0 } })).status()).toBe(409)
    const history = await (await regular.get('/api/purchase-drafts')).json()
    expect(history.drafts.some((d: PurchaseDraft) => d.id === draft.id && d.author === adminId)).toBe(true)
    await repo.synchronize(async () => data())
    expect((await admin.post('/api/purchase-drafts', { data: { ...command, key: randomUUID() } })).status()).toBe(409)
  } finally { await admin.dispose(); await regular.dispose(); await anonymous.dispose() }
})
