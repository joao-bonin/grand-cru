import { randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { createTokenCipher } from '../../server/infrastructure/erp/token-cipher'
import { createErpSessionStore } from '../../server/infrastructure/persistence/erp-session-store'

const pair = { accessToken: 'synthetic-access-secret', refreshToken: 'synthetic-refresh-secret' }
const key = Buffer.alloc(32, 17).toString('base64')

describe('ERP session token encryption', () => {
  it('encrypts both tokens with fresh nonce and authenticated identity', () => {
    const cipher = createTokenCipher(key)
    const first = cipher.encrypt(pair, 'integration-one')
    const second = cipher.encrypt(pair, 'integration-one')
    expect(first).not.toBe(second)
    expect(first).not.toContain(pair.accessToken)
    expect(first).not.toContain(pair.refreshToken)
    expect(cipher.decrypt(first, 'integration-one')).toEqual(pair)
    expect(cipher.decrypt(second, 'integration-one')).toEqual(pair)
    expect(() => cipher.decrypt(first, 'integration-two')).toThrow(/^ERP_TOKEN_DECRYPTION_FAILED$/)
  })
  it.each(['', ' '.repeat(44), Buffer.alloc(31).toString('base64'), Buffer.alloc(33).toString('base64'), key.replace(/=$/, ''), `${key}\n`])('rejects malformed or noncanonical key %j', (invalid) => {
    expect(() => createTokenCipher(invalid)).toThrow(/^ERP_TOKEN_KEY_INVALID$/)
  })
  it('rejects tampering, truncation and wrong key without leaking ciphertext or plaintext', () => {
    const cipher = createTokenCipher(key)
    const encrypted = cipher.encrypt(pair, 'one')
    const parts = encrypted.split('.')
    const ciphertext = Buffer.from(parts[3]!, 'base64')
    ciphertext[0] = ciphertext[0]! ^ 1
    const tampered = [...parts.slice(0, 3), ciphertext.toString('base64')].join('.')
    for (const value of [tampered, 'v1.a.b.c', `${encrypted}.extra`, pair.accessToken, encrypted.slice(0, -3)]) {
      expect(() => cipher.decrypt(value, 'one')).toThrow(/^ERP_TOKEN_DECRYPTION_FAILED$/)
    }
    expect(() => createTokenCipher(randomBytes(32).toString('base64')).decrypt(encrypted, 'one')).toThrow(/^ERP_TOKEN_DECRYPTION_FAILED$/)
  })
  it('rejects empty tokens without echoing either field', () => {
    const cipher = createTokenCipher(key)
    expect(() => cipher.encrypt({ ...pair, refreshToken: ' ' }, 'one')).toThrow(/^ERP_TOKEN_ENCRYPTION_FAILED$/)
  })
})

describe('ERP session storage failures', () => {
  it('sanitizes database failures and releases acquired clients', async () => {
    const release = vi.fn()
    const query = vi.fn().mockRejectedValue(new Error(pair.accessToken))
    const pool = { connect: vi.fn().mockResolvedValue({ query, release }) } as unknown as Pool
    const store = createErpSessionStore(pool, { identity: 'one', cipher: createTokenCipher(key) })
    await expect(store.withSession(async () => 'unreachable')).rejects.toThrow(/^ERP_SESSION_STORAGE_FAILED$/)
    expect(query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(release).toHaveBeenCalledOnce()
  })
  it('preserves service error codes while rolling back the transaction', async () => {
    const release = vi.fn()
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const pool = { connect: vi.fn().mockResolvedValue({ query, release }) } as unknown as Pool
    const store = createErpSessionStore(pool, { identity: 'one', cipher: createTokenCipher(key) })
    const failure = new Error('ERP_AUTH_HTTP_429')
    await expect(store.withSession(async () => { throw failure })).rejects.toBe(failure)
    expect(query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(release).toHaveBeenCalledOnce()
  })
  it('sanitizes connection failure before acquiring a client', async () => {
    const pool = { connect: vi.fn().mockRejectedValue(new Error(pair.refreshToken)) } as unknown as Pool
    await expect(createErpSessionStore(pool, { identity: 'one', cipher: createTokenCipher(key) }).withSession(async () => null)).rejects.toThrow(/^ERP_SESSION_STORAGE_FAILED$/)
  })
})
