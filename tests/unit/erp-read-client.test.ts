import { describe, expect, it, vi } from 'vitest'
import { createErpReadClient } from '../../server/infrastructure/erp/read-client'

describe('ERP read boundary CV-02', () => {
  it('only sends GET to the fixed origin with the raw token and redirects disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"items":[]}', { status: 200 }))
    const client = createErpReadClient({ token: 'synthetic-secret', fetch: fetcher })
    expect(await client.get('/v1/produto/produtos', { start: 0, count: 100 })).toEqual({ items: [] })
    expect(fetcher).toHaveBeenCalledWith('https://fgcuritibabatel.varejofacil.com/api/v1/produto/produtos?start=0&count=100', expect.objectContaining({ method: 'GET', redirect: 'error', headers: { Accept: 'application/json', Authorization: 'synthetic-secret' } }))
  })
  it.each(['/auth', '/auth/refresh', '/auth/logout', '/v1/produto/produtos/../logout', 'https://other.test/v1/produto/produtos', '//other.test/v1/produto/produtos', '/v1/produto/produtos?method=POST', '/v1/produto/%70rodutos', '/v1/compra/pedidos/1/cancelar'])('rejects unapproved path %s before transport', async (path) => {
    const fetcher = vi.fn()
    await expect(createErpReadClient({ token: 'synthetic-secret', fetch: fetcher }).get(path)).rejects.toThrow('ERP_READ_PATH_FORBIDDEN')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects method injection through query and runtime extra arguments', async () => {
    const fetcher = vi.fn()
    const client = createErpReadClient({ token: 'synthetic-secret', fetch: fetcher })
    await expect(client.get('/v1/produto/produtos', { _method: 'POST' })).rejects.toThrow('ERP_READ_QUERY_FORBIDDEN')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('stops on 401 without refresh and never discloses the response body', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('synthetic-secret personal-data', { status: 401 }))
    await expect(createErpReadClient({ token: 'synthetic-secret', fetch: fetcher }).get('/v1/venda/cupons-fiscais')).rejects.toThrow('ERP_AUTHENTICATION_PENDING')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('sanitizes transport and HTTP errors', async () => {
    for (const response of [Promise.reject(new Error('synthetic-secret')), Promise.resolve(new Response('synthetic-secret', { status: 500 })), Promise.resolve(new Response('synthetic-secret', { status: 302 }))]) {
      const fetcher = vi.fn().mockImplementation(() => response)
      await expect(createErpReadClient({ token: 'synthetic-secret', fetch: fetcher }).get('/v1/estoque/saldos')).rejects.toThrow(/^ERP_(TRANSPORT_FAILED|HTTP_500|HTTP_302)$/)
    }
  })
  it('aborts a stalled ERP read after fifteen seconds without another request', async () => {
    vi.useFakeTimers()
    try {
      const fetcher = vi.fn().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('request contains synthetic-secret')))
      }))
      const result = createErpReadClient({ token: 'synthetic-secret', fetch: fetcher }).get('/v1/estoque/saldos')
      const assertion = expect(result).rejects.toThrow('ERP_TRANSPORT_FAILED')
      await vi.advanceTimersByTimeAsync(15_000)
      await assertion
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(fetcher.mock.calls[0]?.[1].signal.aborted).toBe(true)
    } finally { vi.useRealTimers() }
  })
  it.each(['/v1/produto/produtos%3f_method%3dDELETE', '/v1/produto/produtos#fragment', '/v1/produto/produtos/../produtos', '/v1/produto/produtos\\evil', '/v1/produto/produtos/%2e%2e/auth/logout', '/v1/produto/produtos/1/fornecedores?x=1', '/v1/produto/produtos/1%2f2/fornecedores'])('rejects encoded or normalized path injection %s', async (path) => {
    const fetcher = vi.fn()
    await expect(createErpReadClient({ token: 'synthetic-secret', fetch: fetcher }).get(path)).rejects.toThrow('ERP_READ_PATH_FORBIDDEN')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('query values remain encoded data and cannot override method, URL, or headers', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"items":[]}', { status: 200 }))
    const client = createErpReadClient({ token: 'synthetic-secret', fetch: fetcher })
    const get = client.get as (...args: unknown[]) => Promise<unknown>
    expect(Object.keys(client)).toEqual(['get'])
    await get('/v1/produto/produtos', { q: 'id==1&method=DELETE#https://evil.test', sort: 'id' }, { method: 'POST', body: '{}', headers: { Authorization: 'attacker' } })
    const [url, init] = fetcher.mock.calls[0]!
    expect(new URL(url).origin).toBe('https://fgcuritibabatel.varejofacil.com')
    expect(new URL(url).pathname).toBe('/api/v1/produto/produtos')
    expect(new URL(url).searchParams.get('q')).toBe('id==1&method=DELETE#https://evil.test')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('synthetic-secret')
    expect(init.body).toBeUndefined()
    expect(init.redirect).toBe('error')
  })
  it.each([{ start: -1 }, { start: 0.5 }, { count: 0 }, { count: 101 }, { count: Infinity }])('rejects unbounded pagination queries %j before transport', async (query) => {
    const fetcher = vi.fn()
    await expect(createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/produto/produtos', query)).rejects.toThrow('ERP_READ_QUERY_FORBIDDEN')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('preserves raw numeric identifiers beyond JavaScript integer precision', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"id":9007199254740993,"descricao":"numeric 9007199254740993 and \\"id\\":9007199254740993","quantity":6}', { status: 200 }))
    expect(await createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/produto/produtos')).toEqual({ id: '9007199254740993', descricao: 'numeric 9007199254740993 and "id":9007199254740993', quantity: 6 })
  })
  it('rejects oversized responses by declared length and actual streamed bytes', async () => {
    for (const response of [new Response('{}', { headers: { 'content-length': '5242881' } }), new Response(' '.repeat(5242881))]) {
      const fetcher = vi.fn().mockResolvedValue(response)
      await expect(createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/produto/produtos')).rejects.toThrow('ERP_RESPONSE_TOO_LARGE')
    }
  })
  it('rejects ambiguous oversized exponent numbers instead of rounding', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"id":9.007199254740993e15}'))
    await expect(createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/produto/produtos')).rejects.toThrow('ERP_NUMERIC_PRECISION_INVALID')
  })
  it('sanitizes interrupted response streams', async () => {
    const stream = new ReadableStream({ start(controller) { controller.error(new Error('synthetic-secret private-body')) } })
    const fetcher = vi.fn().mockResolvedValue(new Response(stream))
    await expect(createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/produto/produtos')).rejects.toThrow('ERP_TRANSPORT_FAILED')
  })
  it('rejects malformed JSON and empty tokens', async () => {
    expect(() => createErpReadClient({ token: ' ' })).toThrow('ERP_TOKEN_REQUIRED')
    const fetcher = vi.fn().mockResolvedValue(new Response('not json', { status: 200 }))
    await expect(createErpReadClient({ token: 'synthetic', fetch: fetcher }).get('/v1/estoque/saldos')).rejects.toThrow('ERP_INVALID_JSON')
  })
})
