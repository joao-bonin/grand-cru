import { createError, getCookie, getHeader, getRequestURL, setCookie, deleteCookie } from 'h3'
import type { H3Event } from 'h3'
import { createUserRepository } from '../db/repository'
import { AuthError, createAuthService, requireAdmin } from '../services/auth'
import { dummyPasswordHash, verifyPassword } from '../services/passwords'
import { createTokenService, SESSION_SECONDS } from '../services/tokens'
import { LastAdministratorError } from '../domain/identity/user-lifecycle'

let repository: ReturnType<typeof createUserRepository> | undefined
export const SESSION_COOKIE = 'grand_cru_session'
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' })

export function authContext(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (!config.databaseUrl || !config.jwtSecret) throw createError({ statusCode: 503, statusMessage: 'Autenticação ainda não configurada.' })
  const tokens = createTokenService(config.jwtSecret)
  repository ??= createUserRepository(config.databaseUrl)
  const service = createAuthService({ repository, verifyPassword, dummyPasswordHash, ...tokens })
  return { repository, service }
}

export async function currentUser(event: H3Event, adminOnly = false) {
  const user = await authContext(event).service.authenticate(getCookie(event, SESSION_COOKIE))
  if (adminOnly) requireAdmin(user)
  return user
}

export function assertSameOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin')
  try {
    if (!origin || new URL(origin).host !== getRequestURL(event).host || getHeader(event, 'sec-fetch-site') === 'cross-site') throw new Error()
  } catch { throw new AuthError(403, 'Origem da requisição inválida.') }
}

export const setSession = (event: H3Event, token: string) => setCookie(event, SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_SECONDS })
export const clearAuthSession = (event: H3Event) => deleteCookie(event, SESSION_COOKIE, cookieOptions())

export async function authEndpoint<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation() }
  catch (error) {
    if (error instanceof AuthError) throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    if (error instanceof LastAdministratorError) throw createError({ statusCode: 409, statusMessage: error.message })
    throw error
  }
}
