import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const erpSessions = pgTable('erp_sessions', {
  identity: text('identity').primaryKey(),
  tokensCiphertext: text('tokens_ciphertext').notNull(),
  version: integer('version').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  renewedAt: timestamp('renewed_at', { withTimezone: true }).notNull(),
})
