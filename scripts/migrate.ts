import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDatabasePool } from '../server/db/connection'

if (!process.env.NUXT_DATABASE_URL) throw new Error('Configure NUXT_DATABASE_URL.')
const client = createDatabasePool(process.env.NUXT_DATABASE_URL)
try {
  await migrate(drizzle({ client }), { migrationsFolder: './server/db/migrations-postgresql' })
  console.log('Migrations aplicadas.')
} finally { await client.end() }
