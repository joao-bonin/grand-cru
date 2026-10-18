import { describe, expect, it } from 'vitest'
import { queryRecommendations } from '../../shared/application/replenishment-query'
import { recommendation } from '../fixtures/replenishment'

const items = Array.from({ length: 43 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `sku-${String(index).padStart(2, '0')}`, description: `Vinho ${index}`, supplierId: index < 20 ? 'f1' : 'f2' }, policy: null, ruptureDate: index === 40 ? '2026-10-20' : null, issues: index > 39 ? ['Pendência'] : [] }))
describe('consulta paginada de recomendações', () => {
  it('separa compras positivas disponíveis antes da paginação sem ocultar o catálogo completo', () => {
    const source = [
      { ...recommendation, suggested: 0 },
      { ...recommendation, suggested: null },
      { ...recommendation, suggested: 12, issues: ['Reservas desconhecidas'] },
      ...Array.from({ length: 23 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `buy-${String(index).padStart(2, '0')}` } })),
    ]
    const first = queryRecommendations(source, { actionable: true, count: 20 })
    const last = queryRecommendations(source, { actionable: true, start: 20, count: 20 })
    expect(first.total).toBe(23)
    expect(first.items.map(item => item.product.id)).toEqual(Array.from({ length: 20 }, (_, index) => `buy-${String(index).padStart(2, '0')}`))
    expect(last.items.map(item => item.product.id)).toEqual(['buy-20', 'buy-21', 'buy-22'])
    expect(queryRecommendations(source, {}).total).toBe(26)
    expect(queryRecommendations(source, { issues: true }).items).toEqual([source[2]])
    expect(queryRecommendations(source, { actionable: false }).total).toBe(3)
    expect(queryRecommendations(source, { actionable: true, issues: true }).total).toBe(0)
  })
  it('prioriza ruptura e recorta três páginas sem perda ou repetição', () => {
    const first = queryRecommendations(items, { start: 0, count: 20 })
    const second = queryRecommendations(items, { start: 20, count: 20 })
    const last = queryRecommendations(items, { start: 40, count: 20 })
    expect(first.items[0]!.product.id).toBe('sku-40')
    expect(first).toMatchObject({ start: 0, count: 20, total: 43, supplierIds: ['f1', 'f2'] })
    expect([first.items.length, second.items.length, last.items.length]).toEqual([20, 20, 3])
    expect(new Set([...first.items, ...second.items, ...last.items].map(item => item.product.id)).size).toBe(43)
    expect(queryRecommendations(items, { start: 43, count: 20 }).items).toEqual([])
  })
  it('aplica filtros ao conjunto inteiro antes do recorte e mantém fornecedores globais', () => {
    const result = queryRecommendations(items, { product: '  VINHO 42  ', supplier: 'f2', issues: true, start: 0, count: 20 })
    expect(result.items.map(item => item.product.id)).toEqual(['sku-42'])
    expect(result.total).toBe(1)
    expect(result.supplierIds).toEqual(['f1', 'f2'])
    expect(queryRecommendations(items, { risk: true }).items.map(item => item.product.id)).toEqual(['sku-40'])
    expect(queryRecommendations(items, { risk: false }).total).toBe(42)
  })
  it('preserva consulta completa para rodadas e não altera o conjunto original', () => {
    const original = items.map(item => item.product.id)
    expect(queryRecommendations(items, {}).items).toHaveLength(43)
    expect(items.map(item => item.product.id)).toEqual(original)
    expect(queryRecommendations([], { count: 20 })).toEqual({ items: [], start: 0, count: 20, total: 0, supplierIds: [] })
  })
  it('desempata por produto e loja antes de recortar uma entrada fora de ordem', () => {
    const source = [
      { id: 'b', storeId: 's2', ruptureDate: null },
      { id: 'a', storeId: 's2', ruptureDate: null },
      { id: 'a', storeId: 's1', ruptureDate: null },
      { id: 'z', storeId: 's1', ruptureDate: '2026-10-17' },
      { id: 'x', storeId: 's1', ruptureDate: '2026-10-17' },
      { id: 'k', storeId: 's1', ruptureDate: '2026-10-18' },
    ].map(({ id, storeId, ruptureDate }) => ({ ...recommendation, product: { ...recommendation.product, id, storeId }, ruptureDate }))
    const identities = (rows: typeof source) => rows.map(item => `${item.product.id}/${item.product.storeId}`)
    expect(identities(queryRecommendations(source, {}).items)).toEqual(['x/s1', 'z/s1', 'k/s1', 'a/s1', 'a/s2', 'b/s2'])
    expect(identities(queryRecommendations(source, { start: 3, count: 2 }).items)).toEqual(['a/s1', 'a/s2'])
  })

})
