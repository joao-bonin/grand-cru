import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import type { ErpData, Policy, PurchaseDraft, Snapshot, SyncStatus } from '../../../shared/types/replenishment'
import { AuthError } from '../../services/auth'
import { checkpointIsFresh, syncDatasets, type SyncCheckpoint, type SyncSession } from '../../application/erp/checkpoints'

export const policyKey = (storeId: string, productId: string) => JSON.stringify([storeId, productId])
export interface PurchasingRepository {
  snapshot: () => Promise<Snapshot | null>
  status: () => Promise<SyncStatus>
  synchronize: (load: (session: SyncSession) => Promise<ErpData>, options?: { scope: string }) => Promise<SyncStatus>
  policies: () => Promise<Policy[]>
  savePolicy: (policy: Policy) => Promise<Policy>
  drafts: () => Promise<PurchaseDraft[]>
  findDraft: (key: string) => Promise<PurchaseDraft | null>
  saveDraft: (draft: PurchaseDraft, expectedVersion: number, expectedSnapshot: string) => Promise<PurchaseDraft>
}
const idle: SyncStatus = { id: null, state: 'idle', startedAt: null, finishedAt: null, error: null, snapshotId: null }
function syncRow(row: Record<string, unknown> | undefined): SyncStatus {
  if (!row) return { ...idle }
  const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value == null ? null : String(value)
  const checkpoint = row.checkpoint as SyncCheckpoint | null
  const completed = checkpoint ? syncDatasets.filter(dataset => Object.hasOwn(checkpoint.completed, dataset)) : []
  const current = syncDatasets.find(dataset => dataset === row.current_dataset) ?? null
  return { id: row.id as string | null, state: row.state as SyncStatus['state'], startedAt: iso(row.started_at), finishedAt: iso(row.finished_at), error: row.error as string | null, snapshotId: row.snapshot_id as string | null,
    progress: { completed, current, resumable: row.state === 'failed' && row.error !== 'ERP_AUTHENTICATION_PENDING' && completed.length > 0 && checkpointIsFresh(checkpoint) } }
}
const source = 'varejofacil'
const syncLock = 72641016
const interruptedMessage = 'A atualização foi interrompida. Tente novamente; a versão anterior foi preservada.'
const failedMessage = 'Não foi possível concluir a leitura do ERP. Confira autenticação e fontes; a versão anterior foi preservada.'
async function syncState(client: PoolClient): Promise<SyncStatus> {
  return syncRow((await client.query('SELECT * FROM erp_sync WHERE source=$1', [source])).rows[0])
}
async function transaction<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try { await client.query('BEGIN'); const result = await operation(client); await client.query('COMMIT'); return result }
  catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}
export function createPurchasingRepository(pool: Pool): PurchasingRepository {
  const repository: PurchasingRepository = {
    async snapshot() {
      const result = await pool.query('SELECT s.id,s.created_at,s.data FROM erp_snapshots s JOIN erp_sync e ON e.snapshot_id=s.id WHERE e.source=$1', ['varejofacil'])
      const row = result.rows[0]
      return row ? { id: row.id, createdAt: row.created_at.toISOString(), data: row.data } as Snapshot : null
    },
    async status() {
      const client = await pool.connect()
      let locked = false
      try {
        const status = await syncState(client)
        if (status.state !== 'running') return status
        // A free session lock proves that the former worker no longer owns the run.
        locked = (await client.query('SELECT pg_try_advisory_lock($1) AS locked', [syncLock])).rows[0].locked
        if (!locked) return status
        await client.query(`UPDATE erp_sync SET state='failed',finished_at=now(),error=$1 WHERE source=$2 AND state='running'`, [interruptedMessage, source])
        return await syncState(client)
      } finally {
        try { if (locked) await client.query('SELECT pg_advisory_unlock($1)', [syncLock]) }
        finally { client.release() }
      }
    },
    async synchronize(load, options) {
      const client = await pool.connect()
      let locked = false
      try {
        locked = (await client.query('SELECT pg_try_advisory_lock($1) AS locked', [syncLock])).rows[0].locked
        if (!locked) return await syncState(client)
        const previous = (await client.query('SELECT * FROM erp_sync WHERE source=$1', [source])).rows[0]
        const stored = previous?.checkpoint as SyncCheckpoint | null
        const recover = options && previous?.state !== 'success' && checkpointIsFresh(stored) && stored.scope === options.scope
        let checkpoint: SyncCheckpoint = recover ? stored! : { version: 1, scope: options?.scope ?? '', createdAt: new Date().toISOString(), completed: {} }
        const id = recover && previous?.id ? previous.id as string : randomUUID()
        await client.query(`INSERT INTO erp_sync(source,id,state,started_at,checkpoint,current_dataset) VALUES($1,$2,'running',$3,$4,null) ON CONFLICT(source) DO UPDATE SET id=$2,state='running',started_at=$3,finished_at=null,error=null,checkpoint=$4,current_dataset=null`, [source, id, checkpoint.createdAt, options ? JSON.stringify(checkpoint) : null])
        const session: SyncSession = {
          completed: checkpoint.completed,
          async start(dataset) {
            await client.query('UPDATE erp_sync SET current_dataset=$1 WHERE source=$2 AND id=$3', [dataset, source, id])
          },
          async save(dataset, data) {
            checkpoint = { ...checkpoint, completed: { ...checkpoint.completed, [dataset]: data } }
            if (options) await client.query('UPDATE erp_sync SET checkpoint=$1,current_dataset=null WHERE source=$2 AND id=$3', [JSON.stringify(checkpoint), source, id])
            session.completed = checkpoint.completed
          },
        }
        let publishing = false
        try {
          const data = await load(session)
          const snapshotId = randomUUID()
          await client.query('BEGIN')
          publishing = true
          await client.query('INSERT INTO erp_snapshots(id,data) VALUES($1,$2)', [snapshotId, JSON.stringify(data)])
          await client.query(`UPDATE erp_sync SET state='success',snapshot_id=$1,finished_at=now(),error=null,checkpoint=null,current_dataset=null WHERE source=$2`, [snapshotId, source])
          await client.query('COMMIT')
          publishing = false
        } catch (cause) {
          if (publishing) await client.query('ROLLBACK')
          const authenticationPending = cause instanceof Error && cause.message === 'ERP_AUTHENTICATION_PENDING'
          await client.query(`UPDATE erp_sync SET state='failed',finished_at=now(),error=$1,checkpoint=CASE WHEN $2 THEN null ELSE checkpoint END WHERE source=$3`, [authenticationPending ? 'ERP_AUTHENTICATION_PENDING' : failedMessage, authenticationPending, source])
        }
        return await syncState(client)
      } finally {
        try { if (locked) await client.query('SELECT pg_advisory_unlock($1)', [syncLock]) }
        finally { client.release() }
      }
    },
    async policies() { return (await pool.query('SELECT data FROM replenishment_policies ORDER BY key')).rows.map(row => row.data as Policy) },
    async savePolicy(policy) {
      return transaction(pool, async client => {
        const key = policyKey(policy.storeId, policy.productId)
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [key])
        const current = (await client.query('SELECT version FROM replenishment_policies WHERE key=$1 FOR UPDATE', [key])).rows[0]
        if ((current?.version ?? 0) !== policy.version) throw new AuthError(409, 'A política foi alterada. Atualize os dados.')
        const saved = { ...policy, version: policy.version + 1 }
        await client.query('INSERT INTO replenishment_policies(key,version,data) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET version=$2,data=$3', [key, saved.version, JSON.stringify(saved)])
        return saved
      })
    },
    async drafts() { return (await pool.query('SELECT data FROM purchase_drafts ORDER BY id')).rows.map(row => row.data as PurchaseDraft) },
    async findDraft(key) { return (await pool.query('SELECT data FROM purchase_drafts WHERE key=$1', [key])).rows[0]?.data ?? null },
    async saveDraft(draft, expectedVersion, expectedSnapshot) {
      return transaction(pool, async client => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [draft.key])
        const byKey = (await client.query('SELECT data FROM purchase_drafts WHERE key=$1', [draft.key])).rows[0]?.data as PurchaseDraft | undefined
        if (byKey && byKey.id !== draft.id) {
          if (byKey.author !== draft.author || byKey.snapshotId !== draft.snapshotId || byKey.state !== draft.state || JSON.stringify(byKey.items.map(i => [i.storeId, i.productId, i.adjusted, i.policyVersion])) !== JSON.stringify(draft.items.map(i => [i.storeId, i.productId, i.adjusted, i.policyVersion]))) throw new AuthError(409, 'Chave de rodada já utilizada por outra revisão.')
          return byKey
        }
        const snapshot = (await client.query('SELECT snapshot_id FROM erp_sync WHERE source=$1 FOR SHARE', ['varejofacil'])).rows[0]
        if (snapshot?.snapshot_id !== expectedSnapshot) throw new AuthError(409, 'Os dados foram atualizados. Revise a rodada.')
        const current = (await client.query('SELECT data,version FROM purchase_drafts WHERE id=$1 FOR UPDATE', [draft.id])).rows[0]
        if ((current?.version ?? 0) !== expectedVersion) throw new AuthError(409, 'A rodada foi alterada. Atualize os dados.')
        if (current && (current.data.key !== draft.key || current.data.author !== draft.author)) throw new AuthError(409, 'Identidade da rodada inválida.')
        for (const item of draft.items) {
          if (!item.reference?.policy) throw new AuthError(400, 'Memória de cálculo ausente.')
          const key = policyKey(item.storeId, item.productId)
          const policy = (await client.query('SELECT version FROM replenishment_policies WHERE key=$1 FOR SHARE', [key])).rows[0]
          if (policy?.version !== item.reference.policy.version) throw new AuthError(409, 'Os parâmetros foram atualizados. Revise a rodada.')
        }
        const saved = { ...draft, version: expectedVersion + 1 }
        await client.query('INSERT INTO purchase_drafts(id,key,version,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET version=$3,data=$4', [saved.id, saved.key, saved.version, JSON.stringify(saved)])
        return saved
      })
    },
  }
  return repository
}
