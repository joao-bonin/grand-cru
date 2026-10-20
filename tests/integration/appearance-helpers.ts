import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'
import { recommendation } from '../fixtures/replenishment'
import { sampleUsers } from '../fixtures/users'
import type { PurchaseDraft } from '../../shared/types/replenishment'
import type { BusinessDashboardReport } from '../../shared/types/dashboard'

export async function localRequestsOnly(page: Page) {
  const external: string[] = []
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      external.push(url.hostname)
      return route.abort()
    }
    return route.continue()
  })
  return external
}

export async function setAppearance(page: Page, scheme: 'light' | 'dark', preference?: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: scheme })
  if (preference) await page.addInitScript(value => localStorage.setItem('nuxt-color-mode', value), preference)
}

export async function expectReadable(locator: Locator, pseudo?: '::placeholder', minimum = 4.5) {
  await expect(locator).toBeVisible()
  const sample = await locator.evaluate((element, pseudoElement) => {
    type Pixel = [number, number, number, number]
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    function pixel(color: string): Pixel {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const data = context.getImageData(0, 0, 1, 1).data
      return [data[0]!, data[1]!, data[2]!, data[3]! / 255]
    }
    function over(top: Pixel, bottom: Pixel): Pixel {
      const alpha = top[3] + bottom[3] * (1 - top[3])
      return [0, 1, 2].map(index => (top[index]! * top[3] + bottom[index]! * bottom[3] * (1 - top[3])) / alpha).concat(alpha) as Pixel
    }
    const ancestors: Element[] = []
    for (let current: Element | null = element; current; current = current.parentElement) ancestors.push(current)
    let surface: Pixel = [255, 255, 255, 1]
    for (const ancestor of [...ancestors].reverse()) surface = over(pixel(getComputedStyle(ancestor).backgroundColor), surface)
    const style = getComputedStyle(element, pseudoElement)
    const foreground = pixel(style.color)
    // Opacity is multiplied through the tree; placeholder opacity is independent.
    foreground[3] *= ancestors.reduce((opacity, ancestor) => opacity * Number(getComputedStyle(ancestor).opacity), 1)
    if (pseudoElement) foreground[3] *= Number(style.opacity)
    const rendered = over(foreground, surface)
    function luminance(color: Pixel) {
      const linear = color.slice(0, 3).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
    }
    const a = luminance(rendered); const b = luminance(surface)
    return { text: element.textContent?.trim().slice(0, 100), color: style.color, background: surface, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), fontSize: style.fontSize }
  }, pseudo)
  expect(sample.ratio, JSON.stringify(sample)).toBeGreaterThanOrEqual(minimum)
  return sample
}

export async function capture(page: Page, name: string, samples: unknown[]) {
  const directory = process.env.APPEARANCE_ARTIFACT_DIR
  if (!directory) return
  await mkdir(directory, { recursive: true })
  await page.evaluate(() => { window.scrollTo(0, 0); return new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))) })
  await page.screenshot({ path: join(directory, `${name}.png`), fullPage: true })
  await writeFile(join(directory, `${name}.json`), JSON.stringify({ environment: 'Local browser; synthetic fixtures and mocked app APIs; no ERP access', samples }, null, 2))
}

export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

export const dashboardFixture: BusinessDashboardReport = {
  state: 'ready', snapshot: { id: 'snapshot-1', createdAt: '2026-10-16T12:00:00Z' }, issues: [],
  summary: { tracked: 2, calculable: 1, blocked: 1, replenishment: { count: 1, evaluated: 1, unavailable: 1 }, risk: { count: 1, evaluated: 1, unavailable: 1 }, excess: { count: 1, evaluated: 1, unavailable: 1 } },
  items: [
    { productId: 'p1', storeId: 's1', description: 'Vinho reserva', state: 'replenishment', available: 16, minimum: 0, sales: { 30: { quantity: 30, partial: false }, 60: { quantity: 45, partial: false }, 90: { quantity: 60, partial: false }, 365: { quantity: 60, partial: true } }, coverageDays: 16, ruptureDate: '2026-11-01', riskEvaluated: true, horizonDays: 17, suggested: 12, excess: 5, issues: [] },
    { productId: 'p2', storeId: 's2', description: 'Espumante com dados pendentes', state: 'blocked', available: null, minimum: null, sales: { 30: { quantity: null, partial: true }, 60: { quantity: null, partial: true }, 90: { quantity: null, partial: true }, 365: { quantity: null, partial: true } }, coverageDays: null, ruptureDate: null, riskEvaluated: false, horizonDays: null, suggested: null, excess: null, issues: ['Parâmetros locais incompletos.'] },
  ],
}

export async function openSyntheticApp(page: Page, dashboard: BusinessDashboardReport = dashboardFixture) {
  const draft: PurchaseDraft = { id: 'rodada-demo', key: 'synthetic', author: 'ana', createdAt: '2026-10-16T12:00:00Z', snapshotId: 'snapshot-1', version: 1, state: 'reviewed', total: 240, items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', description: 'Vinho reserva', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }] }
  const requests: string[] = []
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    requests.push(`${route.request().method()} ${path}`)
    const responses: Record<string, unknown> = {
      '/api/auth/login': { user: sampleUsers[0] },
      '/api/auth/me': { user: sampleUsers[0] },
      '/api/users': { users: sampleUsers },
      '/api/dashboard': dashboard,
      '/api/erp/status': { configured: false, snapshot: { id: 'snapshot-1', createdAt: '2026-10-16T12:00:00Z' }, status: { id: 'sync-demo', state: 'success', startedAt: null, finishedAt: '2026-10-16T12:00:00Z', error: null, snapshotId: 'snapshot-1' } },
      '/api/replenishment': { items: [recommendation], snapshotId: 'snapshot-1', policies: [recommendation.policy], issues: [] },
      '/api/purchase-drafts': { drafts: [draft] },
    }
    if (path in responses) return route.fulfill({ json: responses[path] })
    if (path.startsWith('/api/_nuxt_icon/')) return route.continue()
    throw new Error(`Unexpected API in appearance test: ${route.request().method()} ${path}`)
  })
  await page.goto('/login')
  await page.getByLabel('Login', { exact: true }).fill('demo.usuario')
  await page.getByLabel('Senha', { exact: true }).fill('senha-sintetica')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('.admin-sidebar')).toBeVisible()
  return requests
}
