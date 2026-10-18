import type { Pool, PoolClient } from 'pg'
import type { ErpSession, ErpSessionStore, ErpTokens } from '../../application/erp/session-contracts'
import type { TokenCipher } from '../erp/token-cipher'

interface SessionRow {
  tokens_ciphertext: string
  version: number
  expires_at: Date | null
  renewed_at: Date
}

const storageError = () => new Error('ERP_SESSION_STORAGE_FAILED')
async function query(client: PoolClient, sql: string, values?: unknown[]) {
  try { return await client.query(sql, values) } catch { throw storageError() }
}

export function createErpSessionStore(pool: Pool, options: { identity: string, cipher: TokenCipher, now?: () => Date }): ErpSessionStore {
  const { identity, cipher, now = () => new Date() } = options
  if (!identity) throw new Error('ERP_SESSION_IDENTITY_REQUIRED')
  return {
    async withSession(operation) {
      let client: PoolClient
      try { client = await pool.connect() } catch { throw storageError() }
      try {
        await query(client, 'BEGIN')
        // A rejected refresh plus one login may use two fifteen-second deadlines.
        await query(client, "SET LOCAL lock_timeout = '35s'")
        await query(client, 'SELECT pg_advisory_xact_lock(hashtextextended($1, 1))', [identity])
        const result = await query(client, 'SELECT tokens_ciphertext, version, expires_at, renewed_at FROM erp_sessions WHERE identity = $1', [identity])
        const row: SessionRow | undefined = result.rows[0]
        let session: ErpSession | null = row ? { ...cipher.decrypt(row.tokens_ciphertext, identity), version: row.version, expiresAt: row.expires_at, renewedAt: row.renewed_at } : null
        const save = async (tokens: ErpTokens): Promise<ErpSession> => {
          if (tokens.expiresAt !== null && (!(tokens.expiresAt instanceof Date) || !Number.isFinite(tokens.expiresAt.getTime()))) throw new Error('ERP_SESSION_EXPIRY_INVALID')
          const ciphertext = cipher.encrypt(tokens, identity)
          const renewedAt = now()
          const saved = await query(client, `INSERT INTO erp_sessions (identity, tokens_ciphertext, version, expires_at, renewed_at)
            VALUES ($1, $2, 1, $3, $4)
            ON CONFLICT (identity) DO UPDATE SET tokens_ciphertext = EXCLUDED.tokens_ciphertext,
              version = erp_sessions.version + 1, expires_at = EXCLUDED.expires_at, renewed_at = EXCLUDED.renewed_at
            RETURNING version`, [identity, ciphertext, tokens.expiresAt, renewedAt])
          session = { ...tokens, version: saved.rows[0].version, renewedAt }
          return session
        }
        const value = await operation(session, save)
        await query(client, 'COMMIT')
        return value
      } catch (error) {
        try { await client.query('ROLLBACK') } catch { /* Preserve the safe original failure. */ }
        throw error
      } finally { client.release() }
    },
  }
}
