import { afterEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(), origin: vi.fn(), readContext: vi.fn(), load: vi.fn(), repository: vi.fn(),
}))
vi.mock('../../server/utils/auth', () => ({ currentUser: mocks.currentUser, assertSameOrigin: mocks.origin, authEndpoint: (operation: () => unknown) => operation() }))
vi.mock('../../server/utils/erp-session', () => ({ erpReadContext: mocks.readContext }))
vi.mock('../../server/utils/purchasing', () => ({ purchasingRepository: mocks.repository }))
vi.mock('../../server/application/erp/synchronize', () => ({ loadErpData: mocks.load }))
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
const sync = (await import('../../server/api/erp/sync.post')).default
const status = (await import('../../server/api/erp/status.get')).default

afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs() })
describe('ES-04 session wiring never exposes secrets', () => {
  it('publishes sync status only after the configured read loader succeeds', async () => {
    const result = { id: 'sync-1', state: 'success', snapshotId: 'snapshot-1' }
    const data = { products: [{ id: '1' }], private: 'synthetic-private-data' }
    const client = { get: vi.fn() }
    mocks.readContext.mockReturnValue({ client, storeId: '1' })
    mocks.load.mockResolvedValue(data)
    const synchronize = vi.fn(async (operation: () => unknown) => { expect(await operation()).toEqual(data); return result })
    mocks.repository.mockReturnValue({ synchronize })
    const event = {} as H3Event
    expect(await sync(event)).toEqual({ status: result })
    expect(mocks.currentUser).toHaveBeenCalledWith(event, true)
    expect(mocks.origin).toHaveBeenCalledWith(event)
    expect(mocks.load).toHaveBeenCalledWith(client, '1')
  })
  it('a configured status contains no credentials, tokens or snapshot payload', async () => {
    vi.stubEnv('ERP_USERNAME', 'synthetic-private-user')
    vi.stubEnv('ERP_PASSWORD', 'synthetic-private-password')
    vi.stubEnv('ERP_TOKEN_ENCRYPTION_KEY', Buffer.alloc(32, 9).toString('base64'))
    vi.stubEnv('ERP_STORE_ID', '1')
    const syncStatus = { state: 'idle', snapshotId: 'snapshot-1' }
    mocks.repository.mockReturnValue({ status: async () => syncStatus, snapshot: async () => ({ id: 'snapshot-1', createdAt: '2026-10-17T12:00:00Z', data: { accessToken: 'synthetic-private-token' } }) })
    const response = await status({} as H3Event)
    expect(response).toEqual({ status: syncStatus, configured: true, snapshot: { id: 'snapshot-1', createdAt: '2026-10-17T12:00:00Z' } })
    expect(JSON.stringify(response)).not.toContain('synthetic-private')
    expect(response).not.toHaveProperty('tokens_ciphertext')
  })
})
