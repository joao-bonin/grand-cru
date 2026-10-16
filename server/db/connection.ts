import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'

export function databasePoolOptions(databaseUrl: string, certificate = process.env.NUXT_DATABASE_CA) {
  const url = new URL(databaseUrl)
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Configure uma URI PostgreSQL (postgresql://).')
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  // TLS remoto sempre verifica o certificado; parâmetros da URI não podem enfraquecê-lo.
  for (const key of ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key)
  return {
    connectionString: url.toString(),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: local ? false : { rejectUnauthorized: true, ...(certificate ? { ca: certificate } : {}) },
  }
}

export function createDatabasePool(databaseUrl: string) {
  const pool = new Pool(databasePoolOptions(databaseUrl))
  if (process.env.VERCEL) attachDatabasePool(pool)
  return pool
}
