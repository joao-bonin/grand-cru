import { describe, expect, it } from 'vitest'
import { checkpointIsFresh, checkpointLifetimeMs, type SyncCheckpoint } from '../../server/application/erp/checkpoints'

describe('validade do progresso recuperável', () => {
  const now = Date.parse('2026-10-19T12:00:00Z')
  const checkpoint: SyncCheckpoint = { version: 1, scope: 'synthetic-scope', createdAt: new Date(now).toISOString(), completed: {} }
  it('aceita somente progresso recente do formato conhecido', () => {
    expect(checkpointIsFresh(checkpoint, now)).toBe(true)
    expect(checkpointIsFresh(checkpoint, now + checkpointLifetimeMs - 1)).toBe(true)
    expect(checkpointIsFresh(checkpoint, now + checkpointLifetimeMs)).toBe(false)
    expect(checkpointIsFresh(checkpoint, now - 1)).toBe(false)
    expect(checkpointIsFresh({ ...checkpoint, createdAt: 'invalid' }, now)).toBe(false)
    expect(checkpointIsFresh(null, now)).toBe(false)
    expect(checkpointIsFresh({ ...checkpoint, version: 2 } as unknown as SyncCheckpoint, now)).toBe(false)
  })
})
