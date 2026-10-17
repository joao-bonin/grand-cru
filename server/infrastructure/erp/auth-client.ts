import type { ErpAuthenticationClient, ErpTokens } from '../../application/erp/session-contracts'

const origin = 'https://fgcuritibabatel.varejofacil.com/api'
const maximumResponseBytes = 64 * 1024
const maximumTokenLength = 16 * 1024

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximumTokenLength && !/\s/u.test(value) && ![...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
}

/** The JWT payload is only a scheduling hint, never proof of authenticity. */
function expirationHint(token: string): Date | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1] || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    if (!payload || typeof payload !== 'object' || !('exp' in payload) || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp < 0) return null
    const date = new Date(payload.exp * 1000)
    return Number.isFinite(date.getTime()) ? date : null
  } catch { return null }
}

async function readTokens(response: Response, signal: AbortSignal): Promise<ErpTokens> {
  if (Number(response.headers.get('content-length')) > maximumResponseBytes || !response.body) throw new Error('ERP_AUTH_RESPONSE_INVALID')
  const reader = response.body.getReader()
  const abort = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', abort, { once: true })
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let body = ''
  let size = 0
  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>
      try { chunk = await reader.read() }
      catch { throw new Error('ERP_AUTH_TRANSPORT_FAILED') }
      if (signal.aborted) throw new Error('ERP_AUTH_TRANSPORT_FAILED')
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > maximumResponseBytes) {
        void reader.cancel().catch(() => {})
        throw new Error('ERP_AUTH_RESPONSE_INVALID')
      }
      try { body += decoder.decode(chunk.value, { stream: true }) }
      catch { throw new Error('ERP_AUTH_RESPONSE_INVALID') }
    }
  } finally {
    signal.removeEventListener('abort', abort)
    reader.releaseLock()
  }
  let value: unknown
  try { value = JSON.parse(body + decoder.decode()) }
  catch { throw new Error('ERP_AUTH_RESPONSE_INVALID') }
  if (!value || typeof value !== 'object' || !('accessToken' in value) || !('refreshToken' in value) || !validToken(value.accessToken) || !validToken(value.refreshToken)) throw new Error('ERP_AUTH_RESPONSE_INVALID')
  return { accessToken: value.accessToken, refreshToken: value.refreshToken, expiresAt: expirationHint(value.accessToken) }
}

/** Separate, closed authentication boundary: no logout or arbitrary request operation. */
export function createErpAuthenticationClient(options: { username: string, password: string, fetch?: typeof globalThis.fetch }): ErpAuthenticationClient {
  if (!options.username.trim() || !options.password.trim()) throw new Error('ERP_AUTH_CONFIGURATION_INVALID')
  const fetcher = options.fetch ?? globalThis.fetch
  async function request(operation: 'login' | 'refresh', refreshToken?: string): Promise<ErpTokens> {
    const controller = new AbortController()
    let activeResponse: Response | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error('ERP_AUTH_TRANSPORT_FAILED'))
        controller.abort()
      }, 15_000)
    })
    const execute = async () => {
      let response: Response
      try {
        response = await fetcher(origin + (operation === 'login' ? '/auth' : '/auth/refresh'), {
          method: operation === 'login' ? 'POST' : 'GET', redirect: 'error', signal: controller.signal,
          headers: operation === 'login'
            ? { Accept: 'application/json', 'Content-Type': 'application/json' }
            : { Accept: 'application/json', Authorization: refreshToken! },
          ...(operation === 'login' ? { body: JSON.stringify({ username: options.username, password: options.password }) } : {}),
        })
      } catch { throw new Error('ERP_AUTH_TRANSPORT_FAILED') }
      activeResponse = response
      if (controller.signal.aborted) throw new Error('ERP_AUTH_TRANSPORT_FAILED')
      if (response.status === 401 || response.status === 403) throw new Error('ERP_AUTH_REJECTED')
      if (!response.ok) throw new Error(`ERP_AUTH_HTTP_${response.status}`)
      return readTokens(response, controller.signal)
    }
    try { return await Promise.race([execute(), timeout]) }
    catch (error) {
      controller.abort()
      if (activeResponse?.body && !activeResponse.body.locked) void activeResponse.body.cancel().catch(() => {})
      throw error
    }
    finally { clearTimeout(timer) }
  }
  return {
    login: () => request('login'),
    refresh: (token) => {
      if (!validToken(token)) return Promise.reject(new Error('ERP_AUTH_RESPONSE_INVALID'))
      return request('refresh', token)
    },
  }
}
