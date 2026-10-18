import { describe, expect, it } from 'vitest'
import { buildOperationalDashboard } from '../../shared/application/operational-dashboard'
import { recommendation } from '../fixtures/replenishment'
import { dashboardDraft, dashboardSnapshot } from '../fixtures/dashboard'

describe('Resumo operacional para decisões de compra', () => {
  it('calcula os totais da base completa e limita apenas a lista de prioridades', () => {
    const items = Array.from({ length: 47 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `product-${index}`, storeId: index % 2 ? 'loja' : 'b2b' } }))
    const result = buildOperationalDashboard(dashboardSnapshot, items, [], 'success')
    expect(result.products).toMatchObject({ total: 47, ready: 47, pending: 0, rupture: 47, unknownRisk: 0 })
    expect(result.priorities).toHaveLength(5)
    expect(result.priorities.every(item => item.supplier === 'Fornecedor exemplo')).toBe(true)
    expect(items).toHaveLength(47)
  })
  it('não interpreta bloqueio ou falta de cálculo como ausência de necessidade ou de risco', () => {
    const result = buildOperationalDashboard(dashboardSnapshot, [
      { ...recommendation, suggested: 0, ruptureDate: null },
      { ...recommendation, suggested: null, dailyDemand: null, available: null, ruptureDate: null, issues: ['SALES_HISTORY_COVERAGE_UNCONFIRMED'] },
      { ...recommendation, suggested: 12, ruptureDate: null, issues: ['Pendência bloqueante'] },
      { ...recommendation, suggested: null, issues: ['Pendência bloqueante'] },
    ], [], 'success')
    expect(result.products).toEqual({ total: 4, ready: 0, pending: 3, withoutNeed: 1, uncalculated: 2, rupture: 1, unknownRisk: 2 })
    expect(result.priorities).toEqual([])
  })
  it('mantém indisponíveis as métricas de produtos sem snapshot e preserva rodadas já salvas', () => {
    const result = buildOperationalDashboard(null, [recommendation], [dashboardDraft], 'failed')
    expect(result).toMatchObject({ snapshot: null, products: null, priorities: [], synchronization: 'failed', rounds: { draft: 1, reviewed: 0 } })
    expect(result.rounds.recent[0]?.previousData).toBe(true)
  })
  it('prioriza ruptura mais próxima sem incluir produtos bloqueados nem alterar a ordem de origem', () => {
    const items = [
      { ...recommendation, product: { ...recommendation.product, id: 'later' }, ruptureDate: '2026-11-05' },
      { ...recommendation, product: { ...recommendation.product, id: 'blocked' }, ruptureDate: '2026-10-19', issues: ['Dados incompletos'] },
      { ...recommendation, product: { ...recommendation.product, id: 'no-rupture' }, ruptureDate: null },
      { ...recommendation, product: { ...recommendation.product, id: 'earlier' }, ruptureDate: '2026-10-20' },
    ]
    const result = buildOperationalDashboard(dashboardSnapshot, items, [], 'success')
    expect(result.priorities.map(item => item.productId)).toEqual(['earlier', 'later', 'no-rupture'])
    expect(items[0]?.product.id).toBe('later')
  })
  it('acompanha estados das rodadas sem confundir revisão com pedido e sinaliza dados anteriores', () => {
    const drafts = [
      { ...dashboardDraft, id: 'older', createdAt: '2026-10-16T10:00:00Z' },
      { ...dashboardDraft, id: 'reviewed', state: 'reviewed' as const, createdAt: '2026-10-18T15:00:00Z' },
      { ...dashboardDraft, id: 'prior-data', snapshotId: 'old-snapshot', createdAt: '2026-10-18T14:00:00Z' },
      { ...dashboardDraft, id: 'oldest', createdAt: '2026-10-15T10:00:00Z' },
    ]
    const result = buildOperationalDashboard(dashboardSnapshot, [recommendation], drafts, 'running')
    expect(result.rounds).toMatchObject({ draft: 3, reviewed: 1 })
    expect(result.rounds.recent.map(round => [round.id, round.previousData])).toEqual([['reviewed', false], ['prior-data', true], ['older', false]])
    expect(result.rounds.recent[0]).toMatchObject({ itemCount: 1, state: 'reviewed' })
    expect(result.rounds.recent[0]).not.toHaveProperty('total')
    expect(result.rounds.recent[0]).not.toHaveProperty('author')
    expect(drafts[0]?.id).toBe('older')
  })
})
