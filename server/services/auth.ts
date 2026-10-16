import { z } from 'zod'
import type { PublicUser, UserRole } from '../../shared/types/user'

export interface UserRecord {
  id: string
  login: string
  passwordHash: string
  active: boolean
  role: UserRole
  tokenVersion: number
  createdAt: Date
  updatedAt: Date
  lastAccessAt: Date | null
  deletedAt: Date | null
}

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) { super(message) }
}

export const loginName = z.string().trim().toLowerCase().min(3).max(100).regex(/^[a-z0-9._@-]+$/)
export const loginInput = z.object({ login: loginName, password: z.string().min(1).max(128) }).strict()
export const createUserInput = z.object({
  login: loginName,
  password: z.string().min(12).max(128),
  active: z.boolean().default(true),
  role: z.enum(['admin', 'user']).default('user'),
}).strict()
export const updateUserInput = z.object({
  login: loginName.optional(),
  password: z.string().min(12).max(128).optional(),
  active: z.boolean().optional(),
  role: z.enum(['admin', 'user']).optional(),
}).strict().refine(value => Object.keys(value).length > 0)

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id, login: user.login, active: user.active, role: user.role,
    createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(),
    lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
  }
}

export interface AuthRepository {
  findByLogin: (login: string) => Promise<UserRecord | undefined>
  findById: (id: string) => Promise<UserRecord | undefined>
  markAccess: (id: string, date: Date) => Promise<void>
  revoke: (id: string) => Promise<void>
}

export interface TokenClaims { id: string, version: number }
export interface AuthDependencies {
  repository: AuthRepository
  verifyPassword: (hash: string, password: string) => Promise<boolean>
  dummyPasswordHash: () => Promise<string>
  issueToken: (user: UserRecord) => Promise<string>
  verifyToken: (token: string) => Promise<TokenClaims>
  now?: () => Date
}

export function createAuthService(deps: AuthDependencies) {
  return {
    async login(input: unknown) {
      const parsed = loginInput.safeParse(input)
      if (!parsed.success) throw new AuthError(400, 'Informe um login e uma senha válidos.')
      const user = await deps.repository.findByLogin(parsed.data.login)
      const passwordValid = await deps.verifyPassword(user?.passwordHash ?? await deps.dummyPasswordHash(), parsed.data.password)
      if (!user || !passwordValid || !user.active || user.deletedAt) throw new AuthError(401, 'Login ou senha inválidos.')
      const now = deps.now?.() ?? new Date()
      await deps.repository.markAccess(user.id, now)
      const accessedUser = { ...user, lastAccessAt: now }
      return { token: await deps.issueToken(accessedUser), user: publicUser(accessedUser) }
    },
    async authenticate(token: string | undefined) {
      if (!token) throw new AuthError(401, 'Autenticação necessária.')
      let claims: TokenClaims
      try { claims = await deps.verifyToken(token) }
      catch { throw new AuthError(401, 'Sessão inválida ou expirada.') }
      const user = await deps.repository.findById(claims.id)
      if (!user?.active || user.deletedAt || user.tokenVersion !== claims.version) throw new AuthError(401, 'Sessão inválida ou expirada.')
      return user
    },
    async logout(user: UserRecord) { await deps.repository.revoke(user.id) },
  }
}

export function requireAdmin(user: UserRecord) {
  if (user.role !== 'admin') throw new AuthError(403, 'Acesso restrito a administradores.')
}
