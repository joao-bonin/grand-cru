import { expect, test } from '@playwright/test'
import { capture, expectNoOverflow, expectReadable, localRequestsOnly, setAppearance } from './appearance-helpers'

const variants = [
  { name: 'light-desktop', scheme: 'light', width: 1440 },
  { name: 'dark-desktop', scheme: 'dark', width: 1440 },
  { name: 'light-mobile', scheme: 'light', width: 390 },
  { name: 'dark-mobile', scheme: 'dark', width: 390 },
  { name: 'stored-dark', scheme: 'light', preference: 'dark', width: 390 },
  { name: 'stored-light', scheme: 'dark', preference: 'light', width: 390 },
] as const

for (const variant of variants) {
  test(`Login legível e interativo — ${variant.name}`, async ({ page }) => {
    const external = await localRequestsOnly(page)
    await setAppearance(page, variant.scheme, 'preference' in variant ? variant.preference : undefined)
    await page.setViewportSize({ width: variant.width, height: variant.width === 390 ? 844 : 1000 })
    let release!: () => void
    const submitted = new Promise<void>((resolve) => { release = resolve })
    await page.route('**/api/auth/login', async (route) => { await submitted; await route.fulfill({ status: 401, json: { statusCode: 401, statusMessage: 'Synthetic invalid credentials' } }) })
    await page.goto('/login')
    const theme = 'preference' in variant ? variant.preference : variant.scheme
    await expect(page.locator('html')).toHaveClass(new RegExp(theme))
    const samples: unknown[] = []
    for (const selector of ['#login', '#password']) samples.push(await expectReadable(page.locator(selector), '::placeholder'))
    await page.getByLabel('Login', { exact: true }).fill('demo.usuario')
    await page.getByLabel('Senha', { exact: true }).fill('senha-sintetica')
    samples.push(await expectReadable(page.locator('#login')))
    samples.push(await expectReadable(page.locator('#password')))
    for (const selector of ['.login-kicker', '.login-description', '.login-form label', '.password-toggle', '.login-submit', '.access-help', '.security-note', '.login-footer']) samples.push(await expectReadable(page.locator(selector).first()))
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
    await expect(page.locator('#password')).toHaveAttribute('type', 'text')
    await expect(page.locator('.password-toggle')).toHaveAttribute('aria-pressed', 'true')
    samples.push(await expectReadable(page.locator('#password')))
    await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click()
    await expect(page.locator('#password')).toHaveAttribute('type', 'password')
    await page.locator('#login').focus()
    expect(await page.locator('#login').evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2)
    await expectNoOverflow(page)
    await capture(page, `login-${variant.name}`, samples)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.locator('.login-submit')).toBeDisabled()
    await expect(page.locator('#login')).toBeDisabled()
    await expect(page.locator('#password')).toBeDisabled()
    await expect(page.locator('.password-toggle')).toBeDisabled()
    await expect(page.locator('.login-submit')).toContainText('Entrando')
    release()
    await expect(page.getByRole('alert')).toContainText('Login ou senha inválidos.')
    samples.push(await expectReadable(page.getByRole('alert')))
    await expect(page.locator('.login-submit')).toBeEnabled()
    await capture(page, `login-error-${variant.name}`, samples)
    await expectNoOverflow(page)
    expect(external).toEqual([])
  })
}
