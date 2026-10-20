import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createDatabasePool } from '../../server/db/connection'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createUserRepository } from '../../server/db/repository'
import { hashPassword, verifyPassword } from '../../server/services/passwords'

const databaseUrl = process.env.NUXT_DATABASE_URL
if (!databaseUrl || !['127.0.0.1', 'localhost'].includes(new URL(databaseUrl).hostname)) throw new Error('Os testes de integração exigem um PostgreSQL local configurado em NUXT_DATABASE_URL.')
const repository = createUserRepository(databaseUrl)
const connection = createDatabasePool(databaseUrl)
const prefix = `test-${randomUUID().slice(0, 8)}`
const password = randomBytes(32).toString('hex')
const adminLogin = `${prefix}-admin`
const userLogin = `${prefix}-user`
const viewerLogin = `${prefix}-viewer`
const inactiveLogin = `${prefix}-inactive`
const headers = { Origin: 'http://127.0.0.1:3000' }
async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const getNuxtApp = (window as Window & { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp
    if (!getNuxtApp) return false
    try { return getNuxtApp().isHydrating === false } catch { return false }
  })
}
const ipKeys = ['127.0.0.1', '::ffff:127.0.0.1', '::1', 'unknown'].map(ip => createHash('sha256').update(`ip:${ip}`).digest('hex'))
async function resetLocalIpAttempts() {
  for (const key of ipKeys) await connection.query('DELETE FROM login_attempts WHERE "key" = $1', [key])
}
let adminId: string
let userId: string

test.beforeAll(async () => {
  const passwordHash = await hashPassword(password)
  adminId = (await repository.create({ login: adminLogin, passwordHash, active: true, role: 'admin' })).id
  userId = (await repository.create({ login: userLogin, passwordHash, active: true, role: 'user' })).id
  await repository.create({ login: viewerLogin, passwordHash, active: true, role: 'user' })
  await repository.create({ login: inactiveLogin, passwordHash, active: false, role: 'user' })
  await resetLocalIpAttempts()
})

test.afterAll(async () => {
  await connection.query('DELETE FROM users WHERE login LIKE $1', [`${prefix}%`])
  const keys = [...ipKeys, ...[adminLogin, userLogin, viewerLogin, inactiveLogin, `${prefix}-unknown`].map(login => createHash('sha256').update(`login:${login}`).digest('hex'))]
  for (const key of keys) await connection.query('DELETE FROM login_attempts WHERE "key" = $1', [key])
  await repository.close()
  await connection.end()
})

test('login, cookies, permissões, edição, inativação e logout com PostgreSQL real', async ({ playwright }) => {
  const anonymous = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000' })
  const admin = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000', extraHTTPHeaders: headers })
  const regular = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000', extraHTTPHeaders: headers })
  try {
    expect((await anonymous.get('/api/auth/me')).status()).toBe(401)
    expect((await anonymous.get('/api/users')).status()).toBe(401)
    expect((await anonymous.post('/api/auth/login', { data: { login: adminLogin, password } })).status()).toBe(403)
    expect((await admin.post('/api/auth/login', { data: { login: adminLogin, password: 'wrong' } })).status()).toBe(401)
    expect((await admin.post('/api/auth/login', { data: { login: inactiveLogin, password } })).status()).toBe(401)

    const login = await admin.post('/api/auth/login', { data: { login: adminLogin, password } })
    expect(login.status()).toBe(200)
    expect(login.headers()['set-cookie']).toContain('HttpOnly')
    expect(login.headers()['set-cookie']).toContain('SameSite=Strict')
    expect(login.headers()['cache-control']).toBe('no-store')
    const savedCookie = login.headers()['set-cookie']!.split(';')[0]!
    const logged = (await login.json()).user
    expect(logged.lastAccessAt).not.toBeNull()
    expect(logged).not.toHaveProperty('passwordHash')
    expect((await admin.get('/api/users')).status()).toBe(200)
    expect((await admin.get('/users')).status()).toBe(200)

    expect((await regular.post('/api/auth/login', { data: { login: userLogin, password } })).status()).toBe(200)
    expect((await regular.get('/api/users')).status()).toBe(403)
    expect((await regular.post('/api/users', { data: { login: `${prefix}-blocked`, password } })).status()).toBe(403)
    expect((await regular.patch(`/api/users/${adminId}`, { data: { active: false } })).status()).toBe(403)
    expect((await regular.delete(`/api/users/${adminId}`)).status()).toBe(403)
    expect((await anonymous.delete(`/api/users/${adminId}`, { headers })).status()).toBe(401)

    const newUser = await admin.post('/api/users', { data: { login: `${prefix}-created`, password } })
    expect(newUser.status()).toBe(201)
    const created = (await newUser.json()).user
    expect(created.createdAt).toBeTruthy()
    expect(created.updatedAt).toBeTruthy()
    expect(created.lastAccessAt).toBeNull()
    expect(created).not.toHaveProperty('passwordHash')
    expect((await admin.post('/api/users', { data: { login: `${prefix}-created`, password } })).status()).toBe(409)

    const update = await admin.patch(`/api/users/${userId}`, { data: { active: false } })
    expect(update.status()).toBe(200)
    expect((await update.json()).user.active).toBe(false)
    expect((await regular.get('/api/auth/me')).status()).toBe(401)
    const stored = await repository.findById(userId)
    expect(stored?.updatedAt.getTime()).toBeGreaterThanOrEqual(stored!.createdAt.getTime())
    const activeAdmins = (await repository.list()).filter(user => user.active && user.role === 'admin')
    if (activeAdmins.length === 1) {
      expect((await admin.patch(`/api/users/${adminId}`, { data: { active: false } })).status()).toBe(409)
      expect((await admin.delete(`/api/users/${adminId}`)).status()).toBe(409)
    }

    const removedSession = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3000', extraHTTPHeaders: headers })
    try {
      expect((await removedSession.post('/api/auth/login', { data: { login: `${prefix}-created`, password } })).status()).toBe(200)
      expect((await admin.delete(`/api/users/${created.id}`, { headers: { Origin: 'https://example.invalid' } })).status()).toBe(403)
      expect((await admin.delete(`/api/users/${created.id}`)).status()).toBe(200)
      expect((await removedSession.get('/api/auth/me')).status()).toBe(401)
      expect((await admin.delete(`/api/users/${created.id}`)).status()).toBe(404)
      expect((await admin.patch(`/api/users/${created.id}`, { data: { active: true } })).status()).toBe(404)
      expect((await admin.get('/api/users')).ok()).toBe(true)
      expect((await (await admin.get('/api/users')).json()).users.some((user: { id: string }) => user.id === created.id)).toBe(false)
      const retained = await connection.query('SELECT active, deleted_at FROM users WHERE id = $1', [created.id])
      const retainedRow = (retained.rows as { active: boolean, deleted_at: Date | null }[])[0]!
      expect(retainedRow.active).toBe(false)
      expect(retainedRow.deleted_at).not.toBeNull()
      expect((await admin.post('/api/users', { data: { login: `${prefix}-created`, password } })).status()).toBe(409)
    } finally { await removedSession.dispose() }

    expect((await admin.post('/api/auth/logout')).status()).toBe(200)
    expect((await anonymous.get('/api/auth/me', { headers: { Cookie: savedCookie } })).status()).toBe(401)
  } finally { await anonymous.dispose(); await admin.dispose(); await regular.dispose() }
})

test('cadastro, edição, busca, inativação e exclusão com confirmação pela tela', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Login', { exact: true }).fill(adminLogin)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Usuários', exact: true }).click()
  await page.getByRole('button', { name: 'Novo usuário', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Novo usuário', exact: true })
  await editor.getByLabel('Login', { exact: true }).fill(`${prefix}-browser`)
  await editor.getByLabel('Senha', { exact: true }).fill(password)
  await editor.getByRole('button', { name: 'Salvar usuário', exact: true }).click()
  await expect(editor).not.toBeVisible()
  await page.getByRole('textbox', { name: 'Buscar usuários' }).fill(`${prefix}-browser`)
  let row = page.locator('article.directory-row').filter({ has: page.getByRole('heading', { name: `${prefix}-browser`, exact: true }) })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Editar', exact: true }).click()
  const edit = page.getByRole('dialog', { name: 'Editar usuário', exact: true })
  await edit.getByLabel('Login', { exact: true }).fill(`${prefix}-edited`)
  await edit.getByRole('button', { name: 'Salvar usuário', exact: true }).click()
  await expect(edit).not.toBeVisible()
  await page.getByRole('textbox', { name: 'Buscar usuários' }).fill(`${prefix}-edited`)
  row = page.locator('article.directory-row').filter({ has: page.getByRole('heading', { name: `${prefix}-edited`, exact: true }) })
  await row.getByRole('button', { name: 'Inativar', exact: true }).click()
  await expect(row.locator('.status-pill')).toHaveText('Inativo')
  await row.getByRole('button', { name: 'Ativar', exact: true }).click()
  await expect(row.locator('.status-pill')).toHaveText('Ativo')
  await row.getByRole('button', { name: 'Excluir', exact: true }).click()
  const confirmation = page.getByRole('dialog', { name: 'Excluir usuário?', exact: true })
  await confirmation.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Excluir', exact: true }).click()
  await confirmation.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click()
  await expect(confirmation).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nenhum usuário encontrado', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('tela de login, navegação autenticada e layout no celular', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta.' })).toBeVisible()
  await page.getByLabel('Login', { exact: true }).fill(adminLogin)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Visão geral', exact: true })).toHaveCount(0)
  await page.goto('/')
  await waitForHydration(page)
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: adminLogin, exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('link', { name: '← Início', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('usuário de consulta inicia no dashboard e não recebe navegação administrativa', async ({ page }) => {
  const adminRequests: string[] = []
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/users') adminRequests.push(request.method())
  })
  await page.goto('/login')
  await page.getByLabel('Login', { exact: true }).fill(viewerLogin)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  await expect(navigation.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(navigation.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Visão geral', exact: true })).toHaveCount(0)
  await page.goto('/')
  await waitForHydration(page)
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  await page.getByRole('link', { name: 'Reposição', exact: true }).click()
  await page.locator('.admin-brand').click()
  await expect(page).toHaveURL('http://127.0.0.1:3000/dashboard')
  expect(adminRequests).toEqual([])
})

test('limita tentativas de login usando contagem persistida no PostgreSQL', async ({ request }) => {
  const login = `${prefix}-unknown`
  await resetLocalIpAttempts()
  for (let attempt = 0; attempt < 10; attempt++) {
    expect((await request.post('/api/auth/login', { headers, data: { login, password: 'wrong' } })).status()).toBe(401)
  }
  expect((await request.post('/api/auth/login', { headers, data: { login, password: 'wrong' } })).status()).toBe(429)
})

test('provisiona administrador pelo comando e preserva uma conta já existente', async () => {
  const login = `${prefix}-provisioned`
  const env = { ...process.env, GRAND_CRU_ADMIN_LOGIN: login, GRAND_CRU_ADMIN_PASSWORD: password }
  const first = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/create-admin.ts'], { env, encoding: 'utf8' })
  expect(first.status).toBe(0)
  const created = await repository.findByLogin(login)
  expect(created?.role).toBe('admin')
  expect(created?.active).toBe(true)
  const second = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/create-admin.ts'], { env, encoding: 'utf8' })
  expect(second.status).toBe(1)
  expect((await repository.findByLogin(login))?.passwordHash).toBe(created?.passwordHash)
})


test('reinicia janela de tentativas expirada e conta acessos concorrentes', async () => {
  const identifier = `${prefix}-window`
  const key = createHash('sha256').update(identifier).digest('hex')
  try {
    await connection.query('INSERT INTO login_attempts (key, attempts, window_started_at) VALUES ($1, 99, $2)', [key, new Date(Date.now() - 16 * 60_000)])
    await repository.consumeLoginAttempt(identifier)
    const reset = await connection.query('SELECT attempts, window_started_at FROM login_attempts WHERE key = $1', [key])
    expect(reset.rows[0].attempts).toBe(1)
    expect(reset.rows[0].window_started_at.getTime()).toBeGreaterThan(Date.now() - 60_000)
    await connection.query('DELETE FROM login_attempts WHERE key = $1', [key])
    const attempts = await Promise.allSettled(Array.from({ length: 20 }, () => repository.consumeLoginAttempt(identifier)))
    expect(attempts.filter(result => result.status === 'rejected').length).toBeGreaterThanOrEqual(10)
    const count = await connection.query('SELECT attempts FROM login_attempts WHERE key = $1', [key])
    expect(count.rows[0].attempts).toBe(20)
  } finally { await connection.query('DELETE FROM login_attempts WHERE key = $1', [key]) }
})


test('recupera senha de administrador existente e revoga sessões antigas', async () => {
  const login = `${prefix}-recovery`
  const oldPassword = randomBytes(32).toString('hex')
  const newPassword = randomBytes(32).toString('hex')
  const created = await repository.create({ login, passwordHash: await hashPassword(oldPassword), role: 'admin', active: true })
  const env = { ...process.env, GRAND_CRU_ADMIN_LOGIN: login, GRAND_CRU_ADMIN_PASSWORD: newPassword }
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/reset-admin-password.ts'], { env, encoding: 'utf8' })
  expect(result.status).toBe(0)
  expect(result.stdout).not.toContain(newPassword)
  const updated = (await repository.findByLogin(login))!
  expect(updated.id).toBe(created.id)
  expect(updated.role).toBe('admin')
  expect(updated.active).toBe(true)
  expect(updated.tokenVersion).toBe(created.tokenVersion + 1)
  expect(await verifyPassword(updated.passwordHash, oldPassword)).toBe(false)
  expect(await verifyPassword(updated.passwordHash, newPassword)).toBe(true)
})
