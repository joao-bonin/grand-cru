import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildBusinessDashboard } from '../../server/domain/dashboard/build-dashboard'
import { loadBusinessDashboard } from '../../server/application/dashboard/load-dashboard'
import { dashboardPolicy, dashboardSnapshot } from '../fixtures/dashboard'

afterEach(() => vi.useRealTimers())
describe('Dashboard de estoque e compras', () => {
  it('distingue ausência de versão de uma versão publicada sem produtos', () => {
    expect(buildBusinessDashboard(null, [])).toMatchObject({ state: 'awaiting_snapshot', summary: null, snapshot: null })
    const snapshot = dashboardSnapshot()
    snapshot.data.products = []
    expect(buildBusinessDashboard(snapshot, [])).toMatchObject({ state: 'ready', summary: { tracked: 0, blocked: 0, replenishment: { count: 0, evaluated: 0, unavailable: 0 } } })
  })
  it('usa a data da versão para vendas, cobertura e risco, sem depender da data da consulta', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2040-01-01'))
    const report = buildBusinessDashboard(dashboardSnapshot(), [dashboardPolicy])
    expect(report.items[0]).toMatchObject({ available: 16, suggested: 12, coverageDays: 16, ruptureDate: '2026-11-02', riskEvaluated: true, state: 'replenishment', sales: { 30: { quantity: 30, partial: false } } })
    expect(report.summary).toMatchObject({ tracked: 1, calculable: 1, risk: { count: 1, evaluated: 1, unavailable: 0 } })
  })
  it('não apresenta falta de política ou estoque desconhecido como ausência de risco', () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.stocks[0]!.reserved = null
    const report = buildBusinessDashboard(snapshot, [])
    expect(report.items[0]).toMatchObject({ state: 'blocked', available: null, suggested: null, excess: null, ruptureDate: null, riskEvaluated: false })
    expect(report.summary).toMatchObject({ blocked: 1, replenishment: { count: 0, evaluated: 0, unavailable: 1 }, risk: { count: 0, evaluated: 0, unavailable: 1 } })
  })
  it('preserva vendas observadas parciais e não inventa cobertura para consumo zero', () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.sales = []; snapshot.data.historyFrom = '2026-08-01'
    const report = buildBusinessDashboard(snapshot, [dashboardPolicy])
    expect(report.items[0]).toMatchObject({ state: 'without_replenishment', suggested: 0, coverageDays: null, sales: { 30: { quantity: 0, partial: false }, 90: { quantity: 0, partial: true }, 365: { quantity: 0, partial: true } } })
  })
  it('separa identidades por loja e informa o denominador de cálculos válidos', () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.products.push({ ...snapshot.data.products[0]!, storeId: 'store-b' })
    const report = buildBusinessDashboard(snapshot, [dashboardPolicy])
    expect(report.summary).toMatchObject({ tracked: 2, calculable: 1, blocked: 1, replenishment: { count: 1, evaluated: 1, unavailable: 1 } })
    expect(report.items.map(item => item.storeId)).toEqual(['store-a', 'store-b'])
  })
  it('identifica observações parciais quando a conciliação descarta uma venda inválida', () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.sales.push({ ...snapshot.data.sales[0]!, id: 'invalid-sale', date: 'invalid' })
    const report = buildBusinessDashboard(snapshot, [dashboardPolicy])
    expect(report.items[0]).toMatchObject({ state: 'blocked', suggested: null, sales: { 30: { quantity: 30, partial: true } } })
  })
  it('bloqueia identidade duplicada e não soma estoque nem quantidade sugerida', () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.products.push({ ...snapshot.data.products[0]!, description: 'Registro conflitante' })
    const report = buildBusinessDashboard(snapshot, [dashboardPolicy])
    expect(report.summary).toMatchObject({ tracked: 1, calculable: 0, blocked: 1 })
    expect(report.items[0]).toMatchObject({ available: null, suggested: null, riskEvaluated: false, sales: { 30: { quantity: null } } })
    expect(report.items[0]!.issues).toContain('Produto duplicado na mesma loja.')
  })
  it('recusa uma versão com data inválida em vez de usar a data atual', () => {
    expect(() => buildBusinessDashboard({ ...dashboardSnapshot(), createdAt: 'invalid' }, [])).toThrow('Data da versão')
  })
  it('consulta somente as fontes injetadas e propaga falha para a UI tratar', async () => {
    const source = { snapshot: vi.fn().mockResolvedValue(dashboardSnapshot()), policies: vi.fn().mockResolvedValue([dashboardPolicy]) }
    expect((await loadBusinessDashboard(source)).summary?.tracked).toBe(1)
    expect(source.snapshot).toHaveBeenCalledOnce(); expect(source.policies).toHaveBeenCalledOnce()
    source.snapshot.mockRejectedValueOnce(new Error('Banco indisponível'))
    await expect(loadBusinessDashboard(source)).rejects.toThrow('Banco indisponível')
  })
})
