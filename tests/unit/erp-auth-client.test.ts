import { afterEach, describe, expect, it, vi } from 'vitest'
import { createErpAuthenticationClient } from '../../server/infrastructure/erp/auth-client'

const credentials = { username: 'synthetic-user', password: 'synthetic-password' }
const pair = { accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh' }
const response = () => new Response(JSON.stringify(pair))
const jwt = (exp: unknown) => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`

afterEach(() => { vi.useRealTimers() })

describe('ERP authentication boundary ES-01', () => {
  it('exposes only login and refresh and fixes login URL, method and private JSON credentials', async () => {
    const fetcher = vi.fn().mockResolvedValue(response())
    const client = createErpAuthenticationClient({ ...credentials, fetch: fetcher })
    expect(Object.keys(client)).toEqual(['login', 'refresh'])
    expect(await client.login()).toEqual({ ...pair, expiresAt: null })
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://fgcuritibabatel.varejofacil.com/api/auth', expect.objectContaining({
      method: 'POST', redirect: 'error', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(credentials), signal: expect.any(AbortSignal),
    }))
  })
  it('refreshes only by fixed GET with raw refresh token and no body', async () => {
    const fetcher = vi.fn().mockResolvedValue(response())
    const client = createErpAuthenticationClient({ ...credentials, fetch: fetcher })
    await client.refresh('synthetic-old-refresh')
    expect(fetcher).toHaveBeenCalledExactlyOnceWith('https://fgcuritibabatel.varejofacil.com/api/auth/refresh', expect.objectContaining({
      method: 'GET', redirect: 'error', headers: { Accept: 'application/json', Authorization: 'synthetic-old-refresh' },
    }))
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty('body')
  })
  it('ignores injected runtime operation options', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
    const client = createErpAuthenticationClient({ ...credentials, fetch: fetcher })
    await (client.login as (...args: unknown[]) => Promise<unknown>)({ url: 'https://evil.test', method: 'DELETE', path: '/auth/logout' })
    await (client.refresh as (...args: unknown[]) => Promise<unknown>)('synthetic-refresh', { url: 'https://evil.test', method: 'DELETE' })
    expect(fetcher.mock.calls.map(([url, init]) => [url, init.method, init.redirect])).toEqual([
      ['https://fgcuritibabatel.varejofacil.com/api/auth', 'POST', 'error'],
      ['https://fgcuritibabatel.varejofacil.com/api/auth/refresh', 'GET', 'error'],
    ])
  })
  it.each([401, 403, 429, 500, 302])('sanitizes HTTP %i without inspecting its private body or retrying', async (status) => {
    const fetcher = vi.fn().mockResolvedValue(new Response('synthetic-password synthetic-refresh synthetic-access', { status }))
    await expect(createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).rejects.toThrow(status === 401 || status === 403 ? /^ERP_AUTH_REJECTED$/ : new RegExp(`^ERP_AUTH_HTTP_${status}$`))
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('sanitizes fetch failures including redirect rejection without causes', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('synthetic-password synthetic-refresh https://private.test'))
    const error: unknown = await createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login().catch(error => error as Error)
    expect(error).toBeInstanceOf(Error)
    if (!(error instanceof Error)) throw new Error('Expected sanitized authentication error')
    expect(error.message).toBe('ERP_AUTH_TRANSPORT_FAILED')
    expect(error.cause).toBeUndefined()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each(['', 'not-json synthetic-access', 'null', '[]', '{}', '{"accessToken":"synthetic-access"}', '{"refreshToken":"synthetic-refresh"}', '{"accessToken":"","refreshToken":"x"}', '{"accessToken":"x","refreshToken":" "}', '{"accessToken":1,"refreshToken":"x"}', JSON.stringify({ ...pair, refreshToken: 'x'.repeat(16385) })])('rejects malformed or incomplete token pairs without echoing content (%#)', async (body) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(body))
    await expect(createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).rejects.toThrow(/^ERP_AUTH_RESPONSE_INVALID$/)
  })
  it('rejects token header injection before transport', async () => {
    const fetcher = vi.fn()
    const client = createErpAuthenticationClient({ ...credentials, fetch: fetcher })
    for (const token of ['', ' ', 'x\r\nAuthorization: secret', 'x\u0000y', 'x'.repeat(16385)]) await expect(client.refresh(token)).rejects.toThrow(/^ERP_AUTH_RESPONSE_INVALID$/)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects missing credentials before transport', () => {
    const fetcher = vi.fn()
    expect(() => createErpAuthenticationClient({ username: ' ', password: 'synthetic-password', fetch: fetcher })).toThrow(/^ERP_AUTH_CONFIGURATION_INVALID$/)
    expect(() => createErpAuthenticationClient({ username: 'synthetic-user', password: '', fetch: fetcher })).toThrow(/^ERP_AUTH_CONFIGURATION_INVALID$/)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('enforces the response limit on both content length and streamed bytes', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(32768)); controller.enqueue(new Uint8Array(32769)) }, cancel })
    for (const body of [new Response('{}', { headers: { 'content-length': '65537' } }), new Response(stream)]) {
      const fetcher = vi.fn().mockResolvedValue(body)
      await expect(createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).rejects.toThrow(/^ERP_AUTH_RESPONSE_INVALID$/)
    }
    expect(cancel).toHaveBeenCalledTimes(1)
  })
  it('accepts a complete body at exactly 64 KiB', async () => {
    const body = JSON.stringify(pair).padEnd(65536, ' ')
    const fetcher = vi.fn().mockResolvedValue(new Response(body))
    expect(await createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).toEqual({ ...pair, expiresAt: null })
  })
  it('sanitizes interrupted streams and malformed UTF-8', async () => {
    const stream = new ReadableStream({ start(controller) { controller.error(new Error('synthetic-access synthetic-password')) } })
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(stream)).mockResolvedValueOnce(new Response(new Uint8Array([255])))
    const client = createErpAuthenticationClient({ ...credentials, fetch: fetcher })
    await expect(client.login()).rejects.toThrow(/^ERP_AUTH_TRANSPORT_FAILED$/)
    await expect(client.login()).rejects.toThrow(/^ERP_AUTH_RESPONSE_INVALID$/)
  })
  it.each(['fetch', 'body'])('times out stalled %s at 15 seconds without retry, even when fetch ignores abort', async (stage) => {
    vi.useFakeTimers()
    const cancel = vi.fn()
    const fetcher = vi.fn().mockImplementation(() => stage === 'fetch' ? new Promise(() => {}) : Promise.resolve(new Response(new ReadableStream({ cancel }))))
    const result = createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()
    const assertion = expect(result).rejects.toThrow(/^ERP_AUTH_TRANSPORT_FAILED$/)
    await vi.advanceTimersByTimeAsync(14999)
    expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await assertion
    expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(true)
    expect(fetcher).toHaveBeenCalledTimes(1)
    if (stage === 'body') expect(cancel).toHaveBeenCalledTimes(1)
  })
  it('clears its timer after success', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue(response())
    await createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(15000)
    expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(false)
  })
  it('extracts numeric JWT exp only as a scheduling hint', async () => {
    const accessToken = jwt(1800000000)
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...pair, accessToken })))
    expect(await createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).toEqual({ accessToken, refreshToken: pair.refreshToken, expiresAt: new Date(1800000000000) })
  })
  it.each(['opaque-token', 'header.bad-json.signature', jwt('1800000000'), jwt(null), jwt(-1), jwt(1e30)])('keeps unknown expiration nullable for token %#', async (accessToken) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...pair, accessToken })))
    expect((await createErpAuthenticationClient({ ...credentials, fetch: fetcher }).login()).expiresAt).toBeNull()
  })
})
