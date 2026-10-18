import { randomBytes, randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createUserRepository } from '../../server/db/repository'
import { createPurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
import { hashPassword } from '../../server/services/passwords'
import type { ErpData } from '../../shared/types/replenishment'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Exige banco local descartável.')
const pool = createDatabasePool(url)
const users = createUserRepository(url)
const repo = createPurchasingRepository(pool)
const login = `usability-${randomUUID().slice(0, 8)}`
const password = randomBytes(24).toString('hex')
let userId: string
const sku = (index: number) => String(1000008400 + index)
test.beforeAll(async () => {
  userId = (await users.create({ login, passwordHash: await hashPassword(password), role: 'admin', active: true })).id
  const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
  const products = Array.from({ length: 43 }, (_, index) => ({ id: sku(index), storeId: login, description: `Vinho ${String(index).padStart(2, '0')}`, supplierId: index < 20 ? 'f1' : 'f2', purchaseUnit: 'CX', packSize: 6, minimum: 0, cost: 20 }))
  const data: ErpData = { products, suppliers: [{ id: 'f1', name: 'Fornecedor um', leadDays: 10 }, { id: 'f2', name: 'Fornecedor dois', leadDays: 10 }],
    stocks: products.map(product => ({ productId: product.id, storeId: login, locationId: 'local', physical: 16, reserved: 0, blocked: 0, disjoint: true, updatedAt: day(0) })),
    sales: products.flatMap(product => Array.from({ length: 30 }, (_, n) => ({ id: `${product.id}-${n}`, documentId: `${product.id}-${n}`, productId: product.id, storeId: login, date: day(n + 1), quantity: 1, kind: 'sale' as const, cancelled: false, originalSaleId: null }))), purchases: [], historyFrom: day(366), issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429'] }
  await repo.synchronize(async () => data)
  for (const product of products) await repo.savePolicy({ productId: product.id, storeId: login, windowDays: 30, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: 20, supplierId: product.supplierId, version: 0 })
})
test.afterAll(async () => {
  await pool.query('DELETE FROM replenishment_policies WHERE data->>\'storeId\'=$1', [login])
  await pool.query('DELETE FROM users WHERE id=$1', [userId])
  await users.close(); await pool.end()
})

async function assertReadable(page: Page, selector: string) {
  const samples = await page.locator(selector).evaluateAll(elements => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!
    const rgba = (color: string) => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return Array.from(context.getImageData(0, 0, 1, 1).data) }
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index]!, 0)
    return elements.filter(element => element.getClientRects().length && !element.closest('[disabled], [aria-disabled=true]')).map(element => {
      const style = getComputedStyle(element)
      let parent: Element | null = element
      let background = [255, 255, 255, 255]
      while (parent) { const color = rgba(getComputedStyle(parent).backgroundColor); if (color[3]! > 0) { background = color; break } parent = parent.parentElement }
      const a = luminance(rgba(style.color)); const b = luminance(background)
      return { selector: element.className, fontSize: parseFloat(style.fontSize), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
    })
  })
  expect(samples.length).toBeGreaterThan(0)
  for (const sample of samples) {
    expect(sample.fontSize, JSON.stringify(sample)).toBeGreaterThanOrEqual(12)
    expect(sample.ratio, JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5)
  }
}

async function assertFormWidth(page: Page) {
  const form = page.locator('.user-editor')
  expect(await form.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  const fields = await form.locator('input[name=login], input[name=password], [role=combobox]').evaluateAll(elements => elements.map(element => {
    const field = [...element.closest('fieldset')!.children].find(child => child.contains(element))!
    return { width: element.getBoundingClientRect().width, fieldWidth: field.getBoundingClientRect().width }
  }))
  expect(fields).toHaveLength(3)
  for (const field of fields) {
    expect(field.width).toBeGreaterThanOrEqual(field.fieldWidth - 1)
    expect(field.width).toBeLessThanOrEqual(field.fieldWidth + 1)
  }
}

test('paginação real da API local, pendências legíveis e formulário responsivo com contraste', async ({ page }) => {
  test.setTimeout(60_000)
  const external: string[] = []
  await page.route('**/*', route => {
    if (!['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)) { external.push(route.request().url()); return route.abort() }
    return route.continue()
  })
  await page.addInitScript(() => localStorage.setItem('nuxt-color-mode', 'dark'))
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/login')
  await page.getByLabel('Login', { exact: true }).fill(login)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/')
  await page.goto('/replenishment')
  const nav = page.getByRole('navigation', { name: 'Paginação de produtos' })
  await expect(nav).toContainText('1–20 de 42 produtos')
  await expect(page.locator('article.replenishment-item')).toHaveCount(20)
  await page.getByLabel('Incluir na rodada local', { exact: true }).first().check()
  await expect(page.getByRole('button', { name: 'Revisar 1 itens em rodada local' })).toBeEnabled()
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  await expect(nav).toContainText('1–20 de 43 produtos')
  await expect(page.getByRole('button', { name: 'Revisar 0 itens em rodada local' })).toBeDisabled()
  await page.getByLabel('Incluir na rodada local', { exact: true }).first().check()
  await expect(page.getByRole('button', { name: 'Revisar 1 itens em rodada local' })).toBeEnabled()
  const second = page.waitForResponse(response => new URL(response.url()).pathname === '/api/replenishment' && new URL(response.url()).searchParams.get('start') === '20')
  await nav.getByRole('button', { name: 'Próxima', exact: true }).click()
  expect(new URL((await second).url()).searchParams.get('count')).toBe('20')
  await expect(nav).toContainText('21–40 de 43 produtos')
  await expect(page.getByRole('button', { name: 'Revisar 0 itens em rodada local' })).toBeDisabled()
  await nav.getByRole('button', { name: 'Próxima', exact: true }).click()
  await expect(nav).toContainText('41–43 de 43 produtos')
  await expect(page.locator('article.replenishment-item')).toHaveCount(3)
  await expect(nav.getByRole('button', { name: 'Próxima', exact: true })).toBeDisabled()
  await page.getByRole('searchbox', { name: 'Produto', exact: true }).fill('1000008429')
  await expect(nav).toContainText('1–1 de 1 produto')
  const row = page.locator('article.replenishment-item')
  await expect(row).toHaveCount(1)
  await row.getByText('Ver justificativa e pendências', { exact: true }).click()
  await expect(row).toContainText('SKU 1000008429: parâmetros de compra incompletos')
  await expect(row.getByLabel('Incluir na rodada local')).toBeDisabled()
  await expect(page.locator('body')).not.toContainText('PRODUCT_PURCHASE_PARAMETERS_MISSING')
  await page.setViewportSize({ width: 390, height: 844 })
  await nav.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/screenshots/replenishment-pagination-mobile.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await assertReadable(page, '.replenishment-data-issues p, .replenishment-pagination small, .admin-page-heading div > p:last-child')
  await page.goto('/users')
  await assertReadable(page, '.directory-person small, .directory-role, .directory-dates, .metric-card small, .management-card header p, .admin-footer')
  await page.getByRole('button', { name: 'Novo usuário', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Novo usuário', exact: true })
  await expect(dialog.getByText('Identificação e segurança', { exact: true })).toBeVisible()
  await dialog.getByLabel('Login', { exact: true }).fill('maria.silva')
  await dialog.getByLabel('Senha', { exact: true }).fill('synthetic-example-password')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await assertReadable(page, '.admin-dialog [data-slot=description], .user-editor legend, .user-editor label, .user-editor-access p, .user-editor [data-slot=help]')
  for (const control of await dialog.locator('input:not([type=checkbox]), button').all()) {
    const box = await control.boundingBox()
    if (box) expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await assertFormWidth(page)
  await expect(dialog.getByRole('button', { name: 'Salvar usuário', exact: true })).toBeInViewport({ ratio: 1 })
  await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: 'docs/screenshots/user-form-mobile.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await assertFormWidth(page)
  await page.screenshot({ path: 'docs/screenshots/user-form-desktop.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(external).toEqual([])
})
