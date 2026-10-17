import { describe, expect, it, vi } from 'vitest'
import { createAuthenticatedErpReadClient } from '../../server/infrastructure/erp/session-read-client'
import type { ErpSession } from '../../server/application/erp/session-contracts'

const session = (version: number): ErpSession => ({ version, accessToken: `access-${version}`, refreshToken: `refresh-${version}`, expiresAt: null, renewedAt: new Date() })
describe('ES-03 bounded retry through GET boundary', () => {
  it('retries exactly the same allowed GET with the renewed raw token', async () => {
    const sessions = { getSession: vi.fn().mockResolvedValueOnce(session(1)).mockResolvedValueOnce(session(2)) }
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('private-data', { status: 401 })).mockResolvedValueOnce(new Response('{"items":[{"id":1}]}'))
    const client = createAuthenticatedErpReadClient({ sessions, fetch: fetcher })
    expect(await client.get('/v1/produto/produtos', { count: 1 })).toEqual({ items: [{ id: 1 }] })
    expect(sessions.getSession.mock.calls).toEqual([[], [1]])
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(Array(2).fill('https://fgcuritibabatel.varejofacil.com/api/v1/produto/produtos?count=1'))
    expect(fetcher.mock.calls.map(call => call[1].headers.Authorization)).toEqual(['access-1', 'access-2'])
    for (const [, init] of fetcher.mock.calls) { expect(init.method).toBe('GET'); expect(init.body).toBeUndefined(); expect(init.redirect).toBe('error') }
  })
  it('a second 401 terminates without further refresh or GET', async () => {
    const sessions = { getSession: vi.fn().mockResolvedValueOnce(session(1)).mockResolvedValueOnce(session(2)) }
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response('private-data', { status: 401 })))
    await expect(createAuthenticatedErpReadClient({ sessions, fetch: fetcher }).get('/v1/estoque/saldos')).rejects.toThrow('ERP_AUTHENTICATION_PENDING')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(sessions.getSession).toHaveBeenCalledTimes(2)
  })
  it.each(['/auth', '/auth/refresh', '/auth/logout', '/v1/batch', '/v1/compra/pedidos/1/cancelar', 'https://evil.invalid'])('rejects %s before any session or network access', async path => {
    const sessions = { getSession: vi.fn() }
    const fetcher = vi.fn()
    await expect(createAuthenticatedErpReadClient({ sessions, fetch: fetcher }).get(path)).rejects.toThrow('ERP_READ_PATH_FORBIDDEN')
    expect(sessions.getSession).not.toHaveBeenCalled()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects injected query methods before acquiring a session', async () => {
    const sessions = { getSession: vi.fn() }
    await expect(createAuthenticatedErpReadClient({ sessions }).get('/v1/estoque/saldos', { _method: 'POST' })).rejects.toThrow('ERP_READ_QUERY_FORBIDDEN')
    expect(sessions.getSession).not.toHaveBeenCalled()
  })
  it.each([403, 429, 500])('does not refresh or repeat on HTTP %s', async status => {
    const sessions = { getSession: vi.fn().mockResolvedValue(session(1)) }
    const fetcher = vi.fn().mockResolvedValue(new Response('private-data', { status }))
    await expect(createAuthenticatedErpReadClient({ sessions, fetch: fetcher }).get('/v1/estoque/saldos')).rejects.toThrow(`ERP_HTTP_${status}`)
    expect(sessions.getSession).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
