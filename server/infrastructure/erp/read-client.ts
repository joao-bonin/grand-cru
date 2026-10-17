const origin = 'https://fgcuritibabatel.varejofacil.com/api'
const readPaths = new Set([
  '/v1/produto/produtos', '/v1/produto/unidades', '/v1/produto/custos',
  '/v1/pessoa/fornecedores', '/v1/pessoa/lojas',
  '/v1/estoque/saldos', '/v1/estoque/locais',
  '/v1/venda/cupons-fiscais', '/v1/venda/notas-fiscais',
  '/v1/pdv/trocas-devolucoes', '/v1/compra/pedidos',
])
const queryKeys = new Set(['start', 'count', 'q', 'sort', 'exibeCupomCancelamento'])
const maximumResponseBytes = 5 * 1024 * 1024

async function readJson(response: Response): Promise<unknown> {
  if (Number(response.headers.get('content-length')) > maximumResponseBytes) throw new Error('ERP_RESPONSE_TOO_LARGE')
  if (!response.body) throw new Error('ERP_INVALID_JSON')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let size = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > maximumResponseBytes) {
        await reader.cancel()
        throw new Error('ERP_RESPONSE_TOO_LARGE')
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    text += decoder.decode()
  } catch (error) {
    if (error instanceof Error && error.message === 'ERP_RESPONSE_TOO_LARGE') throw error
    // eslint-disable-next-line preserve-caught-error -- Transport causes may expose tokens or response data.
    throw new Error('ERP_TRANSPORT_FAILED')
  } finally { reader.releaseLock() }
  try {
    // Node 24 supplies the original numeric lexeme before JSON's rounded number is used.
    return JSON.parse(text, (_key, value, context?: { source?: string }) => {
      if (typeof value !== 'number' || (Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER)) return value
      if (context?.source && /^-?\d+$/.test(context.source)) return context.source
      throw new Error('ERP_NUMERIC_PRECISION_INVALID')
    }) as unknown
  } catch (error) {
    if (error instanceof Error && error.message === 'ERP_NUMERIC_PRECISION_INVALID') throw error
    // eslint-disable-next-line preserve-caught-error -- JSON syntax errors may contain private response excerpts.
    throw new Error('ERP_INVALID_JSON')
  }
}
export interface ErpReadClient {
  get: (path: string, query?: Record<string, string | number | boolean>) => Promise<unknown>
}

/** The ERP boundary deliberately exposes no login, mutation, refresh or arbitrary request API. */
export function createErpReadClient(options: { token: string, fetch?: typeof globalThis.fetch }): ErpReadClient {
  if (!options.token.trim()) throw new Error('ERP_TOKEN_REQUIRED')
  const fetcher = options.fetch ?? globalThis.fetch
  return {
    async get(path, query = {}) {
      if (!readPaths.has(path) && !/^\/v1\/produto\/produtos\/[0-9]+\/fornecedores$/.test(path)) throw new Error('ERP_READ_PATH_FORBIDDEN')
      const url = new URL(origin + path)
      for (const [key, value] of Object.entries(query)) {
        if (!queryKeys.has(key) || !['string', 'number', 'boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) throw new Error('ERP_READ_QUERY_FORBIDDEN')
        if ((key === 'start' && (!Number.isSafeInteger(value) || Number(value) < 0)) || (key === 'count' && (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 100))) throw new Error('ERP_READ_QUERY_FORBIDDEN')
        url.searchParams.set(key, String(value))
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      try {
        let response: Response
        try {
          response = await fetcher(url.toString(), {
            method: 'GET', redirect: 'error',
            headers: { Accept: 'application/json', Authorization: options.token },
            signal: controller.signal,
          })
        } catch { throw new Error('ERP_TRANSPORT_FAILED') }
        if (response.status === 401) throw new Error('ERP_AUTHENTICATION_PENDING')
        if (!response.ok) throw new Error(`ERP_HTTP_${response.status}`)
        return await readJson(response)
      } finally { clearTimeout(timer) }
    },
  }
}
