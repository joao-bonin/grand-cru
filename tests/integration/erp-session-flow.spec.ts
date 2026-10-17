import { randomBytes, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createTokenCipher } from '../../server/infrastructure/erp/token-cipher'
import { createErpSessionStore } from '../../server/infrastructure/persistence/erp-session-store'
import { createErpAuthenticationClient } from '../../server/infrastructure/erp/auth-client'
import { createErpSessionProvider } from '../../server/application/erp/session-provider'
import { createAuthenticatedErpReadClient } from '../../server/infrastructure/erp/session-read-client'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) throw new Error('Exige PostgreSQL local descartável.')
if (['ERP_ACCESS_TOKEN', 'ERP_USERNAME', 'ERP_PASSWORD'].some(key => process.env[key])) throw new Error('Remova credenciais ERP antes de testar.')

test('login, leitura 401, refresh rotacionado e repetição persistem somente tokens cifrados', async () => {
  const pool = createDatabasePool(url!)
  const identity = `flow-${randomUUID()}`
  const now = new Date('2026-10-17T12:00:00Z')
  const cipher = createTokenCipher(randomBytes(32).toString('base64'))
  const calls: { url: string, method: string | undefined, authorization: string | null }[] = []
  const responses = [
    new Response(JSON.stringify({ accessToken: 'synthetic-initial-access', refreshToken: 'synthetic-initial-refresh' })),
    new Response('synthetic-private-response', { status: 401 }),
    new Response(JSON.stringify({ accessToken: 'synthetic-rotated-access', refreshToken: 'synthetic-rotated-refresh' })),
    new Response('{"items":[{"id":"sku-1"}]}'),
  ]
  const fetcher: typeof globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method, authorization: new Headers(init?.headers).get('Authorization') })
    expect(init?.redirect).toBe('error')
    const response = responses.shift()
    if (!response) throw new Error('Transporte simulado recebeu chamada excedente.')
    return response
  }
  try {
    const store = createErpSessionStore(pool, { identity, cipher, now: () => now })
    const authentication = createErpAuthenticationClient({ username: 'synthetic-user', password: 'synthetic-password', fetch: fetcher })
    const sessions = createErpSessionProvider({ store, authentication, now: () => now })
    const client = createAuthenticatedErpReadClient({ sessions, fetch: fetcher })
    expect(await client.get('/v1/produto/produtos', { count: 1 })).toEqual({ items: [{ id: 'sku-1' }] })
    const origin = 'https://fgcuritibabatel.varejofacil.com/api'
    expect(calls).toEqual([
      { url: `${origin}/auth`, method: 'POST', authorization: null },
      { url: `${origin}/v1/produto/produtos?count=1`, method: 'GET', authorization: 'synthetic-initial-access' },
      { url: `${origin}/auth/refresh`, method: 'GET', authorization: 'synthetic-initial-refresh' },
      { url: `${origin}/v1/produto/produtos?count=1`, method: 'GET', authorization: 'synthetic-rotated-access' },
    ])
    expect(await store.withSession(async session => session)).toEqual({ accessToken: 'synthetic-rotated-access', refreshToken: 'synthetic-rotated-refresh', version: 2, renewedAt: now, expiresAt: null })
    const row = (await pool.query('SELECT tokens_ciphertext FROM erp_sessions WHERE identity=$1', [identity])).rows[0]
    expect(row.tokens_ciphertext).not.toContain('synthetic')
  } finally {
    await pool.query('DELETE FROM erp_sessions WHERE identity=$1', [identity])
    await pool.end()
  }
})
