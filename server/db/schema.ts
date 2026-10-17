import { boolean, timestamp, integer, pgTable, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  login: varchar('login', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  role: varchar('role', { length: 10, enum: ['admin', 'user'] }).notNull().default('user'),
  tokenVersion: integer('token_version').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3, withTimezone: true }).notNull().defaultNow(),
  lastAccessAt: timestamp('last_access_at', { mode: 'date', precision: 3, withTimezone: true }),
  deletedAt: timestamp('deleted_at', { mode: 'date', precision: 3, withTimezone: true }),
})

export const loginAttempts = pgTable('login_attempts', {
  key: varchar('key', { length: 64 }).primaryKey(),
  attempts: integer('attempts').notNull().default(1),
  windowStartedAt: timestamp('window_started_at', { mode: 'date', precision: 3, withTimezone: true }).notNull(),
})

export { erpSnapshots, erpSync, replenishmentPolicies, purchaseDrafts } from './erp-schema'
export { erpSessions } from './erp-session-schema'
