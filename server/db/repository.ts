import { createHash, randomUUID } from 'node:crypto'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { createDatabasePool } from './connection'
import { AuthError } from '../services/auth'
import type { UserRecord } from '../services/auth'
import { loginAttempts, users } from './schema'
import { assertAdministratorRemains } from '../domain/identity/user-lifecycle'

export function createUserRepository(databaseUrl: string) {
  const pool = createDatabasePool(databaseUrl)
  const db = drizzle({ client: pool })
  return {
    async findByLogin(login: string) { return (await db.select().from(users).where(and(eq(users.login, login), isNull(users.deletedAt))).limit(1))[0] },
    async findById(id: string) { return (await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).limit(1))[0] },
    async markAccess(id: string, date: Date) { await db.update(users).set({ lastAccessAt: date }).where(and(eq(users.id, id), isNull(users.deletedAt), eq(users.active, true))) },
    async revoke(id: string) { await db.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, id)) },
    async list() { return db.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.createdAt)) },
    async create(data: Pick<UserRecord, 'login' | 'passwordHash' | 'active' | 'role'>) {
      const id = randomUUID()
      try { await db.insert(users).values({ id, ...data }) }
      catch (error) {
        if (isDuplicate(error)) throw new AuthError(409, 'Este login já está em uso.')
        throw error
      }
      return (await db.select().from(users).where(eq(users.id, id)))[0]!
    },
    async update(id: string, data: Partial<Pick<UserRecord, 'login' | 'passwordHash' | 'active' | 'role'>>) {
      try {
        return await db.transaction(async tx => {
          // Serializa alterações para preservar pelo menos um administrador ativo.
          const rows = await tx.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.id)).for('update')
          const target = rows.find(user => user.id === id)
          if (!target) throw new AuthError(404, 'Usuário não encontrado.')
          const next = { ...target, ...data }
          assertAdministratorRemains(target, next, rows.filter(user => user.active && user.role === 'admin').length)
          await tx.update(users).set({ ...data, updatedAt: new Date(), tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, id))
          return (await tx.select().from(users).where(eq(users.id, id)))[0]!
        })
      } catch (error) {
        if (isDuplicate(error)) throw new AuthError(409, 'Este login já está em uso.')
        throw error
      }
    },
    async remove(id: string) {
      await db.transaction(async tx => {
        const rows = await tx.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.id)).for('update')
        const target = rows.find(user => user.id === id)
        if (!target) throw new AuthError(404, 'Usuário não encontrado.')
        assertAdministratorRemains(target, { ...target, active: false }, rows.filter(user => user.active && user.role === 'admin').length)
        const now = new Date()
        await tx.update(users).set({ active: false, deletedAt: now, updatedAt: now, tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, id))
      })
    },
    async consumeLoginAttempt(identifier: string) {
      const key = createHash('sha256').update(identifier).digest('hex')
      const now = new Date()
      const cutoff = new Date(now.getTime() - 15 * 60 * 1000)
      await db.insert(loginAttempts).values({ key, attempts: 1, windowStartedAt: now }).onConflictDoUpdate({ target: loginAttempts.key, set: {
        attempts: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= ${cutoff} THEN 1 ELSE ${loginAttempts.attempts} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= ${cutoff} THEN ${now}::timestamptz ELSE ${loginAttempts.windowStartedAt} END`,
      } })
      const result = (await db.select().from(loginAttempts).where(eq(loginAttempts.key, key)))[0]!
      if (result.attempts > 10) throw new AuthError(429, 'Muitas tentativas. Tente novamente em 15 minutos.')
    },
    close: () => pool.end(),
  }
}

function isDuplicate(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const detail = error as { code?: string, cause?: unknown }
  return detail.code === '23505' || isDuplicate(detail.cause)
}
