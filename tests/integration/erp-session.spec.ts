import { randomBytes, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { createDatabasePool } from '../../server/db/connection'
import { createTokenCipher } from '../../server/infrastructure/erp/token-cipher'
import { createErpSessionStore } from '../../server/infrastructure/persistence/erp-session-store'

const url = process.env.NUXT_DATABASE_URL
if (!url || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) throw new Error('ERP session integration requires local PostgreSQL.')
if (['ERP_ACCESS_TOKEN', 'ERP_USERNAME', 'ERP_PASSWORD', 'NUXT_ERP_USERNAME', 'NUXT_ERP_PASSWORD'].some(name => process.env[name])) throw new Error('Remove real ERP credentials before integration tests.')
const firstPool = createDatabasePool(url)
const secondPool = createDatabasePool(url)
const key = randomBytes(32).toString('base64')
const cipher = createTokenCipher(key)
const prefix = `session-test-${randomUUID()}`
const tokens = { accessToken: 'synthetic-only-access', refreshToken: 'synthetic-only-refresh', expiresAt: new Date('2030-01-01T12:00:00Z') }

test.afterAll(async () => {
  await firstPool.query('DELETE FROM erp_sessions WHERE identity LIKE $1', [`${prefix}%`])
  await Promise.all([firstPool.end(), secondPool.end()])
})

test('persists encrypted token pairs, timestamps and monotonic versions', async () => {
  const identity = `${prefix}-roundtrip`
  const renewedAt = new Date('2026-10-17T12:00:00Z')
  const store = createErpSessionStore(firstPool, { identity, cipher, now: () => renewedAt })
  const saved = await store.withSession(async (session, save) => {
    expect(session).toBeNull()
    return save(tokens)
  })
  expect(saved).toEqual({ ...tokens, version: 1, renewedAt })
  const raw = (await firstPool.query('SELECT * FROM erp_sessions WHERE identity = $1', [identity])).rows[0]
  expect(raw.tokens_ciphertext).not.toContain(tokens.accessToken)
  expect(raw.tokens_ciphertext).not.toContain(tokens.refreshToken)
  expect(raw.expires_at).toEqual(tokens.expiresAt)
  expect(raw.renewed_at).toEqual(renewedAt)
  const reopened = createErpSessionStore(secondPool, { identity, cipher })
  expect(await reopened.withSession(async session => session)).toEqual(saved)
  const second = await reopened.withSession(async (_session, save) => save({ ...tokens, accessToken: 'synthetic-second-access', expiresAt: null }))
  expect(second.version).toBe(2)
  expect(second.expiresAt).toBeNull()
  expect((await firstPool.query('SELECT COUNT(*)::int AS count FROM erp_sessions WHERE identity = $1', [identity])).rows[0].count).toBe(1)
})

test('serializes two independent pools so one rejected version is renewed only once', async () => {
  const identity = `${prefix}-concurrent`
  const first = createErpSessionStore(firstPool, { identity, cipher })
  const second = createErpSessionStore(secondPool, { identity, cipher })
  await first.withSession(async (_session, save) => save(tokens))
  let renewals = 0
  let firstEntered!: () => void
  let allowSave!: () => void
  const entered = new Promise<void>(resolve => { firstEntered = resolve })
  const permission = new Promise<void>(resolve => { allowSave = resolve })
  const one = first.withSession(async (session, save) => {
    expect(session?.version).toBe(1)
    firstEntered()
    await permission
    renewals++
    return save({ ...tokens, accessToken: 'synthetic-rotated-access', refreshToken: 'synthetic-rotated-refresh' })
  })
  await entered
  const two = second.withSession(async (session, save) => {
    if (session?.version !== 1) return session
    renewals++
    return save(tokens)
  })
  try {
    await expect.poll(async () => {
      const waiting = await firstPool.query("SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event = 'advisory' AND query = $1", ['SELECT pg_advisory_xact_lock(hashtextextended($1, 1))'])
      return waiting.rows[0].count
    }, { timeout: 3000 }).toBeGreaterThan(0)
  } finally { allowSave() }
  const results = await Promise.all([one, two])
  expect(renewals).toBe(1)
  expect(results[0]?.version).toBe(2)
  expect(results[1]).toEqual(results[0])
  expect(results[1]?.refreshToken).toBe('synthetic-rotated-refresh')
})

test('rolls back a new pair on callback failure and preserves the previous pair', async () => {
  const identity = `${prefix}-rollback`
  const store = createErpSessionStore(firstPool, { identity, cipher })
  const original = await store.withSession(async (_session, save) => save(tokens))
  const raw = (await firstPool.query('SELECT tokens_ciphertext FROM erp_sessions WHERE identity = $1', [identity])).rows[0].tokens_ciphertext
  await expect(store.withSession(async (_session, save) => {
    await save({ ...tokens, refreshToken: 'synthetic-new-refresh' })
    throw new Error('ERP_AUTH_HTTP_500')
  })).rejects.toThrow('ERP_AUTH_HTTP_500')
  expect(await store.withSession(async session => session)).toEqual(original)
  expect((await firstPool.query('SELECT tokens_ciphertext FROM erp_sessions WHERE identity = $1', [identity])).rows[0].tokens_ciphertext).toBe(raw)
})

test('waits for a renewal lasting longer than five seconds and reuses the rotated pair', async () => {
  const identity = `${prefix}-slow-renewal`
  const first = createErpSessionStore(firstPool, { identity, cipher })
  const second = createErpSessionStore(secondPool, { identity, cipher })
  await first.withSession(async (_session, save) => save(tokens))
  let entered!: () => void
  const started = new Promise<void>(resolve => { entered = resolve })
  let renewals = 0
  const one = first.withSession(async (_session, save) => {
    renewals++
    entered()
    await new Promise(resolve => setTimeout(resolve, 6000))
    return save({ ...tokens, refreshToken: 'synthetic-slow-rotation' })
  })
  await started
  const two = second.withSession(async session => session)
  const [saved, reused] = await Promise.all([one, two])
  expect(reused).toEqual(saved)
  expect(reused?.refreshToken).toBe('synthetic-slow-rotation')
  expect(reused?.version).toBe(2)
  expect(renewals).toBe(1)
})

test('fails closed for wrong key or tampered ciphertext without invoking the operation', async () => {
  const identity = `${prefix}-corrupt`
  const store = createErpSessionStore(firstPool, { identity, cipher })
  await store.withSession(async (_session, save) => save(tokens))
  let operations = 0
  const operation = async () => { operations++; return null }
  const wrong = createErpSessionStore(secondPool, { identity, cipher: createTokenCipher(randomBytes(32).toString('base64')) })
  await expect(wrong.withSession(operation)).rejects.toThrow(/^ERP_TOKEN_DECRYPTION_FAILED$/)
  await firstPool.query('UPDATE erp_sessions SET tokens_ciphertext = $1 WHERE identity = $2', ['invalid.synthetic-secret', identity])
  await expect(store.withSession(operation)).rejects.toThrow(/^ERP_TOKEN_DECRYPTION_FAILED$/)
  expect(operations).toBe(0)
  const retained = (await firstPool.query('SELECT tokens_ciphertext, version FROM erp_sessions WHERE identity = $1', [identity])).rows[0]
  expect(retained).toEqual({ tokens_ciphertext: 'invalid.synthetic-secret', version: 1 })
})
