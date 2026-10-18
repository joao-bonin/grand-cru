import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { dashboardDraft, dashboardSnapshot } from '../fixtures/dashboard'
import { recommendation } from '../fixtures/replenishment'

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), repository: vi.fn(), build: vi.fn(), header: vi.fn() }))
vi.mock('../../server/utils/auth', () => ({ currentUser: mocks.currentUser, authEndpoint: (operation: () => unknown) => operation() }))
vi.mock('../../server/utils/purchasing', () => ({ purchasingRepository: mocks.repository }))
vi.mock('../../server/domain/replenishment/recommend', () => ({ buildRecommendations: mocks.build }))
vi.mock('h3', () => ({ setHeader: mocks.header }))
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
const handler = (await import('../../server/api/dashboard/index.get')).default
const event = {} as H3Event

beforeEach(() => {
  mocks.currentUser.mockResolvedValue({ role: 'user' })
  mocks.repository.mockReturnValue({ snapshot: vi.fn().mockResolvedValue(dashboardSnapshot), policies: vi.fn().mockResolvedValue([recommendation.policy]), drafts: vi.fn().mockResolvedValue([dashboardDraft]), status: vi.fn().mockResolvedValue({ state: 'success' }) })
  mocks.build.mockReturnValue(Array.from({ length: 23 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `p${index}` } })))
})
afterEach(() => vi.clearAllMocks())

describe('Consulta autenticada do dashboard operacional', () => {
  it('agrega toda a base persistida sem limitar as métricas à primeira página nem consultar o ERP', async () => {
    const result = await handler(event)
    expect(mocks.currentUser).toHaveBeenCalledWith(event)
    expect(mocks.build).toHaveBeenCalledWith(dashboardSnapshot, [recommendation.policy])
    expect(result.products).toMatchObject({ total: 23, ready: 23 })
    expect(result.priorities).toHaveLength(5)
    expect(result.rounds.draft).toBe(1)
    expect(mocks.header).toHaveBeenCalledWith(event, 'Cache-Control', 'no-store')
    expect(result).not.toHaveProperty('issues')
  })
  it('não acessa os dados quando a autenticação é rejeitada', async () => {
    mocks.currentUser.mockRejectedValueOnce(new Error('unauthorized'))
    await expect(handler(event)).rejects.toThrow('unauthorized')
    expect(mocks.repository).not.toHaveBeenCalled()
  })
  it('diferencia falta de sincronização de base vazia e não calcula sem snapshot', async () => {
    mocks.repository.mockReturnValue({ snapshot: async () => null, policies: async () => [], drafts: async () => [], status: async () => ({ state: 'idle' }) })
    const result = await handler(event)
    expect(result.products).toBeNull()
    expect(result.rounds.draft).toBe(0)
    expect(mocks.build).not.toHaveBeenCalled()
  })
  it('propaga falha de leitura em vez de apresentar um resumo parcialmente preenchido como atual', async () => {
    const repository = mocks.repository()
    repository.drafts.mockRejectedValueOnce(new Error('Banco indisponível'))
    await expect(handler(event)).rejects.toThrow('Banco indisponível')
    expect(mocks.build).not.toHaveBeenCalled()
  })
})
