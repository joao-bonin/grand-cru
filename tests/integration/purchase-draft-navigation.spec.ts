import { expect, test } from '@playwright/test'
import { capture, expectNoOverflow, localRequestsOnly, openSyntheticApp } from './appearance-helpers'
import { recommendation } from '../fixtures/replenishment'

for (const width of [950, 390]) {
  test(`Link do cabeçalho abre rodadas e permite voltar — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const external = await localRequestsOnly(page)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await openSyntheticApp(page)
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
    const header = page.locator('.admin-page-heading')
    await expect(header.getByRole('link', { name: 'Rodadas locais', exact: true })).toHaveAttribute('href', '/purchase-drafts')
    await header.getByRole('link', { name: 'Rodadas locais', exact: true }).click()
    await expect(page).toHaveURL(/\/purchase-drafts$/)
    await expect(page.getByRole('heading', { name: 'Rodadas locais', exact: true })).toBeVisible()
    await expect(page.locator('.purchase-draft-history article')).toHaveCount(1)
    await expectNoOverflow(page)
    await capture(page, `header-navigation-populated-${width}`, [])
    await page.locator('.admin-page-heading').getByRole('link', { name: 'Selecionar produtos', exact: true }).click()
    await expect(page).toHaveURL(/\/replenishment$/)
    await expect(page.locator('.replenishment-item')).toBeVisible()
    expect(external).toEqual([])
    expect(errors).toEqual([])
  })

  test(`Clique mostra destino enquanto histórico carrega — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const external = await localRequestsOnly(page)
    await openSyntheticApp(page)
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
    let release!: () => void
    const pendingResponse = new Promise<void>(resolve => { release = resolve })
    let requested!: () => void
    const requestStarted = new Promise<void>(resolve => { requested = resolve })
    await page.route('**/api/purchase-drafts', async route => {
      requested()
      await pendingResponse
      await route.fulfill({ json: { drafts: [] } })
    })
    try {
      await page.locator('.admin-page-heading').getByRole('link', { name: 'Rodadas locais', exact: true }).click()
      await requestStarted
      await expect(page.getByRole('heading', { name: 'Rodadas locais', exact: true })).toBeVisible({ timeout: 2000 })
      await expect(page.getByRole('status')).toContainText('Carregando rodadas locais')
      await expect(page.getByText('Nenhuma rodada local salva.', { exact: true })).toHaveCount(0)
      await capture(page, `header-navigation-loading-${width}`, [])
    } catch (error) {
      await capture(page, `before-header-navigation-loading-${width}`, [])
      throw error
    } finally { release() }
    await expect(page.getByText('Nenhuma rodada local salva.', { exact: true })).toBeVisible()
    await page.locator('.admin-page-heading').getByRole('link', { name: 'Selecionar produtos', exact: true }).click()
    await expect(page).toHaveURL(/\/replenishment$/)
    expect(external).toEqual([])
  })

  test(`Destino exibe erro recuperável e histórico vazio — ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 905 })
    const external = await localRequestsOnly(page)
    await openSyntheticApp(page)
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
    let fail = true
    await page.route('**/api/purchase-drafts', route => route.fulfill(fail
      ? { status: 503, json: { statusCode: 503, statusMessage: 'Synthetic database unavailable' } }
      : { json: { drafts: [] } }))
    await page.locator('.admin-page-heading').getByRole('link', { name: 'Rodadas locais', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rodadas locais', exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('Não foi possível consultar o histórico de rodadas.')
    fail = false
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByText('Nenhuma rodada local salva.', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await capture(page, `header-navigation-empty-${width}`, [])
    await page.locator('.admin-page-heading').getByRole('link', { name: 'Selecionar produtos', exact: true }).click()
    await expect(page).toHaveURL(/\/replenishment$/)
    expect(external).toEqual([])
  })
}

test('Volume de pendências preserva navegação pelo cabeçalho — 950px', async ({ page }) => {
  await page.setViewportSize({ width: 950, height: 905 })
  const external = await localRequestsOnly(page)
  await openSyntheticApp(page)
  await page.route('**/api/replenishment', route => route.fulfill({ json: {
    items: [{ ...recommendation, suggested: null, policy: null, issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING'] }],
    snapshotId: 'snapshot-1', policies: [],
    issues: Array.from({ length: 5000 }, (_, index) => `PRODUCT_PURCHASE_PARAMETERS_MISSING:${1000000000 + index}`),
  } }))
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Reposição', exact: true })).toBeVisible()
  const notices = page.locator('.replenishment-page > .replenishment-issues')
  await expect(notices).toContainText('5.000 produtos estão com dados de compra pendentes')
  await expect(notices.locator('li')).toHaveCount(1)
  await expect(notices).not.toContainText('PRODUCT_PURCHASE_PARAMETERS_MISSING')
  await expect(notices).not.toContainText('1000000000')
  await capture(page, 'purchase-parameters-summary-950', [])
  await page.getByText('Ver justificativa e pendências', { exact: true }).click()
  await expect(page.locator('.replenishment-explanation')).toContainText('Dados de compra pendentes')
  await capture(page, 'purchase-parameters-explanation-950', [])
  await page.locator('.admin-page-heading').getByRole('link', { name: 'Rodadas locais', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Rodadas locais', exact: true })).toBeVisible()
  await expect(page.locator('.purchase-draft-history article')).toHaveCount(1)
  await expectNoOverflow(page)
  expect(external).toEqual([])
})

test('Consulta sem resposta permite tentar novamente após o prazo — 950px', async ({ page }) => {
  await page.setViewportSize({ width: 950, height: 905 })
  const external = await localRequestsOnly(page)
  await openSyntheticApp(page)
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
  await page.clock.install()
  let release!: () => void
  const pendingResponse = new Promise<void>(resolve => { release = resolve })
  let fail = true
  await page.route('**/api/purchase-drafts', async route => {
    if (fail) {
      await pendingResponse
      if (route.request().failure()) return
    }
    await route.fulfill({ json: { drafts: [] } })
  })
  try {
    await page.locator('.admin-page-heading').getByRole('link', { name: 'Rodadas locais', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Carregando rodadas locais')
    await page.clock.fastForward(20_000)
    await expect(page.getByRole('alert')).toContainText('Não foi possível consultar o histórico de rodadas.')
    await expect(page.getByRole('heading', { name: 'Rodadas locais', exact: true })).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await expect(page.getByText('Nenhuma rodada local salva.', { exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(external).toEqual([])
  } finally { release() }
})
