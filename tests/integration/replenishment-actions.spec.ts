import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Recommendation } from '../../shared/types/replenishment'
import { capture, expectNoOverflow, localRequestsOnly, openSyntheticApp } from './appearance-helpers'
import { recommendation } from '../fixtures/replenishment'

const items: Recommendation[] = Array.from({ length: 12 }, (_, index) => ({
  ...recommendation,
  product: { ...recommendation.product, id: `p${index + 1}`, storeId: index === 1 ? 's2' : 's1', description: `Vinho de teste ${index + 1}` },
  policy: { ...recommendation.policy!, productId: `p${index + 1}`, storeId: index === 1 ? 's2' : 's1', leadDays: index + 10, supplierId: `f${index + 1}` },
}))
async function openList(page: Page, rows: Recommendation[] = items, role: 'admin' | 'user' = 'admin') {
  const external = await localRequestsOnly(page)
  const requests = await openSyntheticApp(page)
  if (role === 'user') await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { id: 'viewer', login: 'consulta.demo', role: 'user', active: true } } }))
  await page.route('**/api/replenishment', route => route.fulfill({ json: { items: rows, snapshotId: 'snapshot-1', policies: rows.map(item => item.policy), issues: [] } }))
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
  await expect(page.locator('.replenishment-item')).toHaveCount(rows.length)
  return { external, requests }
}
for (const width of [950, 390]) {
  test(`Segundo produto abre editor dentro do viewport e com foco — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const { external } = await openList(page)
    const trigger = page.locator('.replenishment-item').nth(1).getByRole('button', { name: 'Parâmetros de compra', exact: true })
    await trigger.scrollIntoViewIfNeeded()
    await expect(trigger).toBeInViewport()
    const before = await page.evaluate(() => ({ scrollY, active: document.activeElement?.tagName }))
    await trigger.click()
    const editor = page.locator('.replenishment-policy')
    await expect(editor).toBeVisible()
    const geometry = await editor.evaluate(element => ({ rect: element.getBoundingClientRect().toJSON(), scrollY, focused: element.contains(document.activeElement) }))
    const directory = process.env.APPEARANCE_ARTIFACT_DIR
    if (directory) {
      await mkdir(directory, { recursive: true })
      await writeFile(join(directory, `policy-opening-geometry-${width}.json`), JSON.stringify({ environment: 'Local Chromium; synthetic fixtures; no ERP', before, after: geometry }, null, 2))
    }
    try {
      await expect(editor.locator('[name="windowDays"]')).toBeInViewport({ timeout: 2000 })
      await expect(editor.locator('[name="windowDays"]')).toBeFocused()
    } catch (error) {
      // Keep the actual scrolled viewport in the regression evidence.
      if (directory) await page.screenshot({ path: join(directory, `before-policy-opening-${width}.png`) })
      throw error
    }
    await expect(page.getByRole('dialog', { name: 'Parâmetros de compra', exact: true })).toBeVisible()
    await expect(editor).toContainText('p2 / s2')
    await expect(editor.locator('[name="leadDays"]')).toHaveValue('11')
    await expectNoOverflow(page)
    await capture(page, `policy-visible-${width}`, [])
    await page.keyboard.press('Escape')
    await expect(editor).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(trigger).toBeInViewport()
    expect(external).toEqual([])
  })
}

for (const width of [950, 390]) {
  test(`Salvar parâmetros preserva pendência e permite recuperar falha — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const { external } = await openList(page)
    const trigger = page.locator('.replenishment-item').nth(1).getByRole('button', { name: 'Parâmetros de compra', exact: true })
    await trigger.click()
    const editor = page.locator('.replenishment-policy')
    await expect(editor.locator('[name="windowDays"]')).toBeFocused()
    await editor.locator('[name="leadDays"]').fill('22')
    let release!: () => void
    const pendingResponse = new Promise<void>(resolve => { release = resolve })
    const commands: unknown[] = []
    let first = true
    await page.route('**/api/replenishment/policies/p2', async route => {
      expect(route.request().method()).toBe('PUT')
      commands.push(route.request().postDataJSON())
      if (first) {
        first = false
        await pendingResponse
        return route.fulfill({ status: 503, json: { statusCode: 503, statusMessage: 'Synthetic unavailable' } })
      }
      return route.fulfill({ json: { policy: { ...items[1]!.policy!, leadDays: 22, version: 2 } } })
    })
    try {
      await editor.getByRole('button', { name: 'Salvar parâmetros locais', exact: true }).click()
      await expect(editor.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled()
      await expect(editor.locator('[name="leadDays"]')).toBeDisabled()
      await expect(page.getByRole('button', { name: 'Fechar parâmetros de compra', exact: true })).toBeDisabled()
      await page.keyboard.press('Escape')
      await page.mouse.click(2, 2)
      await expect(editor).toBeVisible()
    } finally { release() }
    const failure = editor.getByRole('alert')
    await expect(failure).toContainText('Não foi possível salvar os parâmetros')
    await expect(failure).toBeFocused()
    await expect(failure).toBeInViewport()
    await expect(editor.locator('[name="leadDays"]')).toHaveValue('22')
    await capture(page, `policy-save-failure-${width}`, [])
    await editor.getByRole('button', { name: 'Salvar parâmetros locais', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    expect(commands).toEqual([expect.objectContaining({ productId: 'p2', storeId: 's2', leadDays: 22, supplierId: 'f2', version: 1 }), expect.objectContaining({ productId: 'p2', storeId: 's2', leadDays: 22, version: 1 })])
    expect(external).toEqual([])
  })

  test(`Conflito mantém valores; cancelar e trocar produto restaura foco — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const { external } = await openList(page)
    const second = page.locator('.replenishment-item').nth(1).getByRole('button', { name: 'Parâmetros de compra', exact: true })
    await second.click()
    const editor = page.locator('.replenishment-policy')
    await editor.locator('[name="leadDays"]').fill('88')
    await page.route('**/api/replenishment/policies/p2', route => route.fulfill({ status: 409, json: { statusCode: 409, statusMessage: 'Synthetic version conflict' } }))
    await editor.getByRole('button', { name: 'Salvar parâmetros locais', exact: true }).click()
    await expect(editor.getByRole('alert')).toBeFocused()
    await expect(editor.getByRole('alert')).toBeInViewport()
    await expect(editor.locator('[name="leadDays"]')).toHaveValue('88')
    await editor.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(second).toBeFocused()
    await expect(second).toBeInViewport()
    const first = page.locator('.replenishment-item').first().getByRole('button', { name: 'Parâmetros de compra', exact: true })
    await first.click()
    await expect(editor).toContainText('p1 / s1')
    await expect(editor.locator('[name="leadDays"]')).toHaveValue('10')
    await expect(editor.locator('[name="supplierId"]')).toHaveValue('f1')
    await expect(editor.getByRole('alert')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(first).toBeFocused()
    expect(external).toEqual([])
  })

  test(`Ajuda de seleção é descrita e acessível por teclado — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const rows = items.map(item => structuredClone(item))
    rows[0]!.suggested = 0
    rows[1] = { ...rows[1]!, suggested: null, policy: null, issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING', 'Relação entre reservas e bloqueios não comprovada'] }
    const { external } = await openList(page, rows)
    const first = page.locator('.replenishment-item').first()
    await expect(first.getByRole('checkbox')).toBeEnabled()
    await first.getByRole('checkbox').check()
    await expect(page.getByRole('button', { name: 'Revisar 1 itens em rodada local', exact: true })).toBeEnabled()
    const second = page.locator('.replenishment-item').nth(1)
    const checkbox = second.getByRole('checkbox')
    await expect(checkbox).toBeDisabled()
    const descriptionId = await checkbox.getAttribute('aria-describedby')
    expect(descriptionId).toBeTruthy()
    const description = await page.evaluate(id => document.getElementById(id!)?.textContent, descriptionId)
    expect(description).toContain('Seleção indisponível')
    const summary = second.getByText('Por que não posso selecionar?', { exact: true })
    await summary.focus()
    await expect(summary).toBeFocused()
    await page.keyboard.press('Enter')
    const help = second.locator('.replenishment-selection-help')
    await expect(help).toContainText('Parâmetros de compra pendentes')
    await expect(help).toContainText('salvos somente no Grand Cru')
    await expect(help).toContainText('ERP')
    await expect(help).toContainText('As reservas e os bloqueios do estoque ainda não foram confirmados')
    await expect(help).not.toContainText('PRODUCT_PURCHASE_PARAMETERS_MISSING')
    await expectNoOverflow(page)
    await capture(page, `selection-help-${width}`, [])
    await second.getByRole('button', { name: 'Parâmetros de compra', exact: true }).click()
    const editor = page.locator('.replenishment-policy')
    await expect(editor.locator('[name="windowDays"]')).toBeFocused()
    await expect(editor.locator('[name="windowDays"]')).toHaveValue('')
    await page.keyboard.press('Escape')
    await expect(second.getByRole('button', { name: 'Parâmetros de compra', exact: true })).toBeFocused()
    await expect(checkbox).toBeDisabled()
    expect(external).toEqual([])
  })
}

test('Usuário de consulta não abre editor nem envia política', async ({ page }) => {
  const { external, requests } = await openList(page, items, 'user')
  await expect(page.getByRole('button', { name: 'Parâmetros de compra', exact: true })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.replenishment-policy')).toHaveCount(0)
  expect(requests.some(request => request.startsWith('PUT '))).toBe(false)
  expect(external).toEqual([])
})
