import { describe, expect, it, vi } from 'vitest'
import { createErpSessionProvider } from '../../server/application/erp/session-provider'
import type { ErpSession, ErpSessionStore, ErpTokens } from '../../server/application/erp/session-contracts'

const now = new Date('2026-10-17T12:00:00Z')
const tokens = (name: string, expiresAt: Date | null = null): ErpTokens => ({ accessToken: `access-${name}`, refreshToken: `refresh-${name}`, expiresAt })
const initial = (expiresAt: Date | null = null): ErpSession => ({ ...tokens('old', expiresAt), renewedAt: new Date('2026-10-16T12:00:00Z'), version: 1 })
function fixture(session: ErpSession | null) {
  let saved = session
  let queue = Promise.resolve()
  const store: ErpSessionStore = {
    withSession(operation) {
      const result = queue.then(async () => {
        let candidate = saved
        const value = await operation(candidate, async value => { candidate = { ...value, version: (candidate?.version ?? 0) + 1, renewedAt: now }; return candidate })
        saved = candidate
        return value
      })
      queue = result.then(() => {}, () => {})
      return result
    },
  }
  const authentication = { login: vi.fn().mockResolvedValue(tokens('login')), refresh: vi.fn().mockResolvedValue(tokens('rotated')) }
  const provider = createErpSessionProvider({ store, authentication, now: () => now })
  return { provider, authentication, stored: () => saved, store }
}

describe('ES-03 private renewable ERP session', () => {
  it('persists the first login pair and its renewal date/version', async () => {
    const f = fixture(null)
    expect(await f.provider.getSession()).toEqual({ ...tokens('login'), renewedAt: now, version: 1 })
    expect(f.stored()).toEqual({ ...tokens('login'), renewedAt: now, version: 1 })
    expect(f.authentication.refresh).not.toHaveBeenCalled()
  })
  it('reuses opaque sessions until rejected, without guessing expiry', async () => {
    const f = fixture(initial())
    expect(await f.provider.getSession()).toEqual(initial())
    expect(f.authentication.login).not.toHaveBeenCalled()
    expect(f.authentication.refresh).not.toHaveBeenCalled()
    expect(await f.provider.getSession(1)).toEqual({ ...tokens('rotated'), renewedAt: now, version: 2 })
    expect(f.authentication.refresh).toHaveBeenCalledWith('refresh-old')
  })
  it.each([0, 30_000, -1])('renews a known expiry at the thirty second boundary: %s', async offset => {
    const f = fixture(initial(new Date(now.getTime() + offset)))
    expect((await f.provider.getSession()).accessToken).toBe('access-rotated')
    expect(f.stored()?.refreshToken).toBe('refresh-rotated')
    expect(f.authentication.login).not.toHaveBeenCalled()
  })
  it('reuses a token with more than thirty seconds remaining', async () => {
    const session = initial(new Date(now.getTime() + 30_001))
    const f = fixture(session)
    expect(await f.provider.getSession()).toEqual(session)
    expect(f.authentication.refresh).not.toHaveBeenCalled()
  })
  it('two providers rejecting one version share the rotated pair', async () => {
    const f = fixture(initial())
    const second = createErpSessionProvider({ store: f.store, authentication: f.authentication, now: () => now })
    const sessions = await Promise.all([f.provider.getSession(1), second.getSession(1)])
    expect(sessions).toEqual([f.stored(), f.stored()])
    expect(f.stored()?.version).toBe(2)
    expect(f.authentication.refresh).toHaveBeenCalledTimes(1)
  })
  it('uses the rotated refresh token on the next rejection', async () => {
    const f = fixture(initial())
    await f.provider.getSession(1)
    f.authentication.refresh.mockResolvedValueOnce(tokens('next'))
    expect((await f.provider.getSession(2)).refreshToken).toBe('refresh-next')
    expect(f.authentication.refresh).toHaveBeenLastCalledWith('refresh-rotated')
  })
  it('a rejected refresh permits one replacement login', async () => {
    const f = fixture(initial())
    f.authentication.refresh.mockRejectedValueOnce(new Error('ERP_AUTH_REJECTED'))
    expect((await f.provider.getSession(1)).accessToken).toBe('access-login')
    expect(f.authentication.login).toHaveBeenCalledTimes(1)
    expect(f.stored()?.version).toBe(2)
  })
  it.each(['ERP_AUTH_HTTP_500', 'ERP_AUTH_HTTP_429', 'ERP_AUTH_TRANSPORT_FAILED', 'ERP_AUTH_RESPONSE_INVALID'])('preserves the prior pair without fallback on %s', async code => {
    const f = fixture(initial())
    f.authentication.refresh.mockRejectedValueOnce(new Error(code))
    await expect(f.provider.getSession(1)).rejects.toThrow(code)
    expect(f.stored()).toEqual(initial())
    expect(f.authentication.login).not.toHaveBeenCalled()
  })
  it('failed replacement login terminates without overwriting the old session', async () => {
    const f = fixture(initial())
    f.authentication.refresh.mockRejectedValueOnce(new Error('ERP_AUTH_REJECTED'))
    f.authentication.login.mockRejectedValueOnce(new Error('ERP_AUTH_REJECTED'))
    await expect(f.provider.getSession(1)).rejects.toThrow('ERP_AUTHENTICATION_PENDING')
    expect(f.stored()).toEqual(initial())
    expect(f.authentication.login).toHaveBeenCalledTimes(1)
  })
})
