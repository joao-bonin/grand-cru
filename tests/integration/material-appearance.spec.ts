import { expect, test } from '@playwright/test'
import { capture, dashboardFixture, expectNoOverflow, expectReadable, localRequestsOnly, openSyntheticApp, setAppearance } from './appearance-helpers'

for (const scheme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`Material e contraste de reposição/rodadas — ${scheme} ${width}`, async ({ page }) => {
      const external = await localRequestsOnly(page)
      await setAppearance(page, scheme)
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      const requests = await openSyntheticApp(page)
      await page.getByRole('link', { name: 'Reposição', exact: true }).click()
      await expect(page.locator('.replenishment-item')).toBeVisible()
      const samples: unknown[] = []
      for (const selector of ['.admin-brand small', '.admin-topbar > span', '.admin-footer', '.admin-kicker', '.admin-page-heading div > p:last-child', '.replenishment-sync h2', '.replenishment-sync p', '.replenishment-item p', '.replenishment-quantity', '.replenishment-filters label', '.replenishment-item button']) samples.push(await expectReadable(page.locator(selector).first()))
      if (width === 1440) for (const selector of ['.sidebar-label', '.sidebar-roadmap > span', '.sidebar-note small', '.sidebar-account small', '.connection-status']) samples.push(await expectReadable(page.locator(selector).first()))
      samples.push(await expectReadable(page.locator('input[name="product"]'), '::placeholder'))
      await page.locator('input[name="product"]').fill('Vinho')
      samples.push(await expectReadable(page.locator('input[name="product"]')))
      await page.getByText('Ver justificativa e pendências', { exact: true }).click()
      samples.push(await expectReadable(page.locator('.replenishment-explanation dt').first()))
      await page.getByRole('button', { name: 'Parâmetros de compra', exact: true }).click()
      await expect(page.locator('.replenishment-policy')).toBeVisible()
      samples.push(await expectReadable(page.locator('.replenishment-policy > p').first()))
      samples.push(await expectReadable(page.locator('.replenishment-policy input').first()))
      await page.locator('.replenishment-policy input').first().focus()
      expect(await page.locator('.replenishment-policy input').first().evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2)
      await expectNoOverflow(page)
      await capture(page, `replenishment-${scheme}-${width}`, samples)
      await page.getByRole('navigation').getByRole('link', { name: 'Rodadas locais', exact: true }).click()
      await expect(page.locator('.purchase-draft-history article')).toBeVisible()
      const historySamples: unknown[] = []
      for (const selector of ['.purchase-draft-history > p', '.purchase-draft-history article h3', '.purchase-draft-history article p', '.purchase-draft-history article button']) historySamples.push(await expectReadable(page.locator(selector).first()))
      await page.getByRole('button', { name: 'Abrir rodada rodada-demo', exact: true }).click()
      await expect(page.locator('.purchase-draft-editor')).toBeVisible()
      historySamples.push(await expectReadable(page.locator('.purchase-draft-editor input[type="number"]').first()))
      for (const button of await page.locator('.replenishment-actions button').all()) {
        const box = await button.boundingBox()
        expect(box!.height).toBeGreaterThanOrEqual(48)
        if (width === 390) expect(box!.width).toBeGreaterThan(250)
      }
      await expectNoOverflow(page)
      await capture(page, `purchase-drafts-${scheme}-${width}`, historySamples)
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Usuários', exact: true }).click()
      await expect(page.locator('.directory-person')).toHaveCount(3)
      const usersSamples: unknown[] = []
      for (const selector of ['.directory-person small', '.directory-role', '.status-pill.is-active', '.status-pill.is-inactive', '.management-card header p']) usersSamples.push(await expectReadable(page.locator(selector).first()))
      if (width === 1440) usersSamples.push(await expectReadable(page.locator('.directory-heading').first()))
      await expectNoOverflow(page)
      await capture(page, `users-${scheme}-${width}`, usersSamples)
      await page.getByRole('button', { name: 'Alternar tema claro ou escuro' }).click()
      const nextTheme = scheme === 'light' ? 'dark' : 'light'
      await expect(page.locator('html')).toHaveClass(new RegExp(nextTheme))
      expect(await page.evaluate(() => localStorage.getItem('nuxt-color-mode'))).toBe(nextTheme)
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Reposição', exact: true }).click()
      await expect(page.locator('html')).toHaveClass(new RegExp(nextTheme))
      await expectReadable(page.locator('.replenishment-sync p').first())
      expect(external).toEqual([])
      expect(requests.some(value => /\/api\/erp\/(sync|auth)/.test(value))).toBe(false)
    })
  }
}

for (const scheme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`Dashboard legível com métricas conhecidas e pendentes — ${scheme} ${width}`, async ({ page }) => {
      const external = await localRequestsOnly(page)
      await setAppearance(page, scheme)
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      await openSyntheticApp(page)
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Dashboard', exact: true }).click()
      await expect(page.locator('.business-product')).toHaveCount(2)
      const samples: unknown[] = []
      for (const selector of ['.business-heading p', '.business-reference', '.business-action', '.business-metric h2', '.business-metric p', '.business-metric small', '.business-product dt', '.business-product dd', '.business-status', '.business-sales small', '.business-data-note p']) samples.push(await expectReadable(page.locator(selector).first()))
      samples.push(await expectReadable(page.locator('.business-status.blocked')))
      samples.push(await expectReadable(page.locator('.business-filters input'), '::placeholder'))
      await expect(page.locator('.business-product').last()).toContainText('Indisponível')
      await expect(page.locator('.business-sales').first()).toContainText('Histórico parcial')
      await page.locator('.business-issues summary').click()
      samples.push(await expectReadable(page.locator('.business-issues li').first()))
      await expectNoOverflow(page)
      await capture(page, `dashboard-${scheme}-${width}`, samples)
      await page.locator('.business-filters input').fill('produto inexistente')
      await expect(page.locator('.business-list-empty')).toContainText('Nenhum produto corresponde aos filtros')
      expect(external).toEqual([])
    })
    for (const state of ['awaiting', 'empty'] as const) {
      test(`Dashboard ${state} — ${scheme} ${width}`, async ({ page }) => {
        const external = await localRequestsOnly(page)
        await setAppearance(page, scheme)
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
        const report = state === 'awaiting'
          ? { state: 'awaiting_snapshot' as const, snapshot: null, summary: null, items: [], issues: [] }
          : { ...dashboardFixture, items: [], summary: { tracked: 0, calculable: 0, blocked: 0, replenishment: { count: 0, evaluated: 0, unavailable: 0 }, risk: { count: 0, evaluated: 0, unavailable: 0 }, excess: { count: 0, evaluated: 0, unavailable: 0 } } }
        await openSyntheticApp(page, report)
        await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Dashboard', exact: true }).click()
        const samples: unknown[] = []
        if (state === 'awaiting') {
          await expect(page.getByRole('heading', { name: 'Aguardando a primeira atualização' })).toBeVisible()
          samples.push(await expectReadable(page.locator('.business-empty p')))
        } else {
          await expect(page.locator('.business-list-empty')).toContainText('sem produtos')
          samples.push(await expectReadable(page.locator('.business-list-empty')))
        }
        await expectNoOverflow(page)
        await capture(page, `dashboard-${state}-${scheme}-${width}`, samples)
        expect(external).toEqual([])
      })
    }
  }
}
