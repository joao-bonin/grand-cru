import { integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import type { ErpData, Policy, PurchaseDraft } from '../../shared/types/replenishment'

export const erpSnapshots = pgTable('erp_snapshots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  data: jsonb('data').$type<ErpData>().notNull(),
})
export const erpSync = pgTable('erp_sync', {
  source: text('source').primaryKey(),
  id: varchar('id', { length: 36 }),
  state: text('state').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  error: text('error'),
  snapshotId: varchar('snapshot_id', { length: 36 }).references(() => erpSnapshots.id),
})
export const replenishmentPolicies = pgTable('replenishment_policies', {
  key: text('key').primaryKey(),
  version: integer('version').notNull(),
  data: jsonb('data').$type<Policy>().notNull(),
})
export const purchaseDrafts = pgTable('purchase_drafts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  key: text('key').notNull().unique(),
  version: integer('version').notNull(),
  data: jsonb('data').$type<PurchaseDraft>().notNull(),
})
