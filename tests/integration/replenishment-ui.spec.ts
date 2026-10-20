import { randomBytes, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createUserRepository } from '../../server/db/repository'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { hashPassword } from '../../server/services/passwords'
import type { ErpData } from '../../shared/types/replenishment'

const databaseUrl = process.env.NUXT_DATABASE_URL
if (!databaseUrl || !['127.0.0.1', 'localhost'].includes(new URL(databaseUrl).hostname)) throw new Error('UI exige PostgreSQL local descartável.')
if (process.env.ERP_ACCESS_TOKEN) throw new Error('UI não pode executar com token do ERP.')
const pool = createDatabasePool(databaseUrl)
const repo = createPurchasingRepository(pool)
const users = createUserRepository(databaseUrl)
const prefix = `ui-${randomUUID().slice(0, 8)}`
const password = randomBytes(24).toString('hex')
let author: string
let snapshotId: string

test.beforeAll(async () => {
  author = (await users.create({ login: prefix, passwordHash: await hashPassword(password), role: 'admin', active: true })).id
  const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
  const fixture: ErpData = { products: [{ id: 'ui-sku', storeId: prefix, description: 'Vinho de revisão mobile', supplierId: 'ui-supplier', purchaseUnit: 'CX', packSize: 6, minimum: 0, cost: 20 }], suppliers: [{ id: 'ui-supplier', name: 'Fornecedor de teste', leadDays: 10 }], stocks: [{ productId: 'ui-sku', storeId: prefix, locationId: 'local', physical: 16, reserved: 0, blocked: 0, disjoint: true, updatedAt: day(0) }], sales: Array.from({ length: 30 }, (_, n) => ({ id: `ui-sale-${n}`, documentId: `ui-doc-${n}`, productId: 'ui-sku', storeId: prefix, date: day(n + 1), quantity: 1, kind: 'sale', cancelled: false, originalSaleId: null })), purchases: [], historyFrom: day(366), issues: [] }
  const synced = await repo.synchronize(async () => fixture)
  snapshotId = synced.snapshotId!
  await repo.savePolicy({ productId: 'ui-sku', storeId: prefix, windowDays: 30, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: 20, supplierId: 'ui-supplier', version: 0 })
})
test.afterAll(async () => {
  await pool.query('DELETE FROM purchase_drafts WHERE data->>\'author\'=$1', [author])
  await pool.query('DELETE FROM replenishment_policies WHERE data->>\'storeId\'=$1', [prefix])
  await pool.query('DELETE FROM users WHERE id=$1', [author])
  await users.close(); await pool.end()
})

test('US07–09: seleção, justificativa, ajuste e histórico persistido no celular', async ({ page }) => {
  const externalRequests: string[] = []
  await page.route('**/*', route => {
    const requestUrl = new URL(route.request().url())
    if (!['127.0.0.1', 'localhost'].includes(requestUrl.hostname)) { externalRequests.push(requestUrl.hostname); return route.abort() }
    return route.continue()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/replenishment')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Login', { exact: true }).fill(prefix)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await page.getByRole('link', { name: 'Reposição', exact: true }).click()
  const row = page.locator('article.replenishment-item').filter({ hasText: 'Vinho de revisão mobile' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('12 unidades')
  await row.getByText('Ver justificativa e pendências', { exact: true }).click()
  await expect(row.getByRole('heading', { name: 'Por que esta sugestão?' })).toBeVisible()
  await expect(row).toContainText(snapshotId)
  await expect(row.locator('[data-field="suggested"]')).toHaveText('12 unidades · 2 embalagens')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await row.getByLabel('Incluir na rodada local').check()
  await page.getByRole('button', { name: 'Revisar 1 itens em rodada local', exact: true }).click()
  const editor = page.locator('form.purchase-draft-editor')
  await expect(editor).toBeVisible()
  await editor.getByRole('spinbutton', { name: 'Quantidade ajustada de Vinho de revisão mobile', exact: true }).fill('18')
  await editor.getByLabel('Conferi os itens e confirmo apenas a revisão local.').check()
  await editor.getByRole('button', { name: 'Concluir revisão local', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Nenhum pedido foi enviado ao ERP')
  const history = page.locator('.purchase-draft-history article').filter({ hasText: 'Vinho de revisão mobile' })
  await expect(history).toHaveCount(1)
  await expect(history).toContainText('sugestão 12 · ajuste 18')
  await expect(history).toContainText('360,00')
  await page.reload()
  await expect(page.locator('.purchase-draft-history article').filter({ hasText: 'Vinho de revisão mobile' })).toContainText('sugestão 12 · ajuste 18')
  await page.locator('.purchase-draft-history article').filter({ hasText: 'Vinho de revisão mobile' }).getByRole('button').click()
  await expect(page.getByRole('spinbutton', { name: 'Quantidade ajustada de Vinho de revisão mobile', exact: true })).toHaveValue('18')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(externalRequests.filter(host => host.includes('varejofacil'))).toEqual([])
})
