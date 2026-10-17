import { describe, expect, it } from 'vitest'
import { queryRecommendations } from '../../shared/application/replenishment-query'
import { recommendation } from '../fixtures/replenishment'

const items = Array.from({ length: 43 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `sku-${String(index).padStart(2, '0')}`, description: `Vinho ${index}`, supplierId: index < 20 ? 'f1' : 'f2' }, policy: null, ruptureDate: index === 40 ? '2026-10-20' : null, issues: index > 39 ? ['Pendência'] : [] }))
describe('consulta paginada de recomendações', () => {
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
})
