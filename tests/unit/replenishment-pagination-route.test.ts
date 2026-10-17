import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { recommendation } from '../fixtures/replenishment'
const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), repository: vi.fn(), build: vi.fn(), query: vi.fn() }))
vi.mock('../../server/utils/auth', () => ({ currentUser: mocks.currentUser, authEndpoint: (operation: () => unknown) => operation() }))
vi.mock('../../server/utils/purchasing', () => ({ purchasingRepository: mocks.repository }))
vi.mock('../../server/domain/replenishment/recommend', () => ({ buildRecommendations: mocks.build }))
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getQuery', mocks.query)
const handler = (await import('../../server/api/replenishment/index.get')).default
const event = {} as H3Event
beforeEach(() => {
  mocks.currentUser.mockResolvedValue({ role: 'user' })
  mocks.repository.mockReturnValue({ snapshot: async () => ({ id: 'snapshot-1', data: { issues: [] } }), policies: async () => [] })
  mocks.build.mockReturnValue(Array.from({ length: 25 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `p${String(index).padStart(2, '0')}` } })))
})
afterEach(() => vi.clearAllMocks())
describe('API local de paginação', () => {
  it('protege a consulta e retorna uma página com total correto sem acesso ao ERP', async () => {
    mocks.query.mockReturnValue({ start: '20', count: '20' })
    const result = await handler(event)
    expect(mocks.currentUser).toHaveBeenCalledWith(event)
    expect(result.items.map(item => item.product.id)).toEqual(['p20', 'p21', 'p22', 'p23', 'p24'])
    expect(result).toMatchObject({ start: 20, count: 20, total: 25, snapshotId: 'snapshot-1', supplierIds: ['f1'] })
  })
  it.each([{ start: '-1' }, { count: '0' }, { count: '1001' }, { start: '1.2' }, { arbitrary: 'invalid' }])('rejeita paginação inválida %j', async query => {
    mocks.query.mockReturnValue(query)
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(mocks.repository).not.toHaveBeenCalled()
  })
  it('não lê snapshot quando a autenticação falha', async () => {
    mocks.currentUser.mockRejectedValueOnce(new Error('unauthorized'))
    await expect(handler(event)).rejects.toThrow('unauthorized')
    expect(mocks.repository).not.toHaveBeenCalled()
  })
  it('mantém total e coleção vazia para página além do fim', async () => {
    mocks.query.mockReturnValue({ start: '25', count: '20' })
    expect(await handler(event)).toMatchObject({ items: [], total: 25, start: 25, count: 20 })
  })
})
