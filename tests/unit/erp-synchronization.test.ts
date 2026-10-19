import { describe, expect, it, vi } from 'vitest'
import { loadErpData } from '../../server/application/erp/synchronize'
import type { SyncDataset } from '../../shared/types/replenishment'
import type { SyncSession } from '../../server/application/erp/checkpoints'

const emptyPage = { start: 0, count: 0, total: 0, items: [] }
function checkpointSession() {
  const started: SyncDataset[] = []
  const saved: SyncDataset[] = []
  const session: SyncSession = {
    completed: {},
    async start(dataset) { started.push(dataset) },
    async save(dataset, data) {
      session.completed = { ...session.completed, [dataset]: data }
      saved.push(dataset)
    },
  }
  return { session, started, saved }
}

describe('caso de uso de leitura do ERP', () => {
  it('obtém somente coleções documentadas e preserva lacunas', async () => {
    const get = vi.fn(async () => ({ start: 0, count: 0, total: 0, items: [] }))
    const data = await loadErpData({ get }, '1')
    expect(get.mock.calls).toHaveLength(6)
    expect(data.products).toEqual([])
    expect(data.historyFrom).toBeNull()
    expect(data.issues).toContain('SALES_HISTORY_COVERAGE_UNCONFIRMED')
    expect(data.issues).toContain('RETURNS_RECONCILIATION_UNCONFIRMED')
  })
  it('não devolve uma carga parcial quando uma fonte falha', async () => {
    const get = vi.fn().mockResolvedValueOnce({ start: 0, count: 0, total: 0, items: [] }).mockRejectedValue(new Error('ERP_AUTHENTICATION_PENDING'))
    await expect(loadErpData({ get }, '1')).rejects.toThrow('ERP_AUTHENTICATION_PENDING')
    expect(get).toHaveBeenCalledTimes(2)
  })
  it('interrompe novas páginas após limite total da execução', async () => {
    const get = vi.fn()
    const now = vi.fn().mockReturnValueOnce(0).mockReturnValue(50_001)
    await expect(loadErpData({ get }, '1', now)).rejects.toThrow('ERP_SYNC_DEADLINE')
    expect(get).not.toHaveBeenCalled()
  })
  it('retoma apenas os conjuntos faltantes sem retornar dados incompletos', async () => {
    const { session, started, saved } = checkpointSession()
    const failedGet = vi.fn(async (path: string) => {
      if (path === '/v1/estoque/saldos') throw new Error('temporary failure')
      return emptyPage
    })
    await expect(loadErpData({ get: failedGet }, '1', Date.now, session)).rejects.toThrow('temporary failure')
    expect(started).toEqual(['catalog', 'stock'])
    expect(saved).toEqual(['catalog'])
    expect(session.completed.stock).toBeUndefined()
    const get = vi.fn(async () => emptyPage)
    const data = await loadErpData({ get }, '1', Date.now, session)
    expect(get.mock.calls).toHaveLength(4)
    expect(get).not.toHaveBeenCalledWith('/v1/produto/produtos', expect.anything())
    expect(get).not.toHaveBeenCalledWith('/v1/pessoa/fornecedores', expect.anything())
    expect(saved).toEqual(['catalog', 'stock', 'sales', 'purchases'])
    expect(data.issues).toContain('RETURNS_RECONCILIATION_UNCONFIRMED')
  })
  it('reinicia o conjunto cuja página falhou, sem persistir página parcial', async () => {
    const { session } = checkpointSession()
    const starts: number[] = []
    const get = vi.fn(async (path: string, query?: Record<string, string | number | boolean>) => {
      if (path !== '/v1/estoque/saldos') return emptyPage
      starts.push(query!.start as number)
      if (query!.start === 1) throw new Error('second page failed')
      return { start: 0, count: 1, total: 2, items: [{ lojaId: 1, produtoId: 5, localId: 1, saldo: 20 }] }
    })
    await expect(loadErpData({ get }, '1', Date.now, session)).rejects.toThrow('second page failed')
    expect(starts).toEqual([0, 1])
    expect(session.completed.stock).toBeUndefined()
    const retry = vi.fn(async () => emptyPage)
    await loadErpData({ get: retry }, '1', Date.now, session)
    expect(retry).toHaveBeenCalledWith('/v1/estoque/saldos', { start: 0, count: 100 })
  })
  it('não grava payload bruto ou dados pessoais no progresso recuperável', async () => {
    const { session } = checkpointSession()
    const get = vi.fn(async (path: string) => {
      if (path === '/v1/estoque/saldos') throw new Error('stop after catalog')
      if (path === '/v1/produto/produtos') return { start: 0, count: 1, total: 1, items: [{ id: 5, descricao: 'Vinho', fornecedorId: 7, unidadeDeCompra: 'CX', itensEmbalagem: 6, contato: 'private-marker' }] }
      return { start: 0, count: 1, total: 1, items: [{ id: 7, nome: 'Fornecedor sintético', telefone: 'private-marker' }] }
    })
    await expect(loadErpData({ get }, '1', Date.now, session)).rejects.toThrow('stop after catalog')
    expect(session.completed.catalog?.products[0]?.id).toBe('5')
    expect(JSON.stringify(session.completed)).not.toContain('private-marker')
  })
  it('não marca como concluído um conjunto com dados inválidos ou progresso não gravado', async () => {
    const { session, saved } = checkpointSession()
    const get = vi.fn(async (path: string) => path === '/v1/estoque/saldos'
      ? { start: 0, count: 1, total: 1, items: [{ lojaId: 1, produtoId: 5, localId: 1 }] }
      : emptyPage)
    await expect(loadErpData({ get }, '1', Date.now, session)).rejects.toThrow('ERP_STOCK_BALANCE_INVALID')
    expect(saved).toEqual(['catalog'])
    const failure = checkpointSession()
    failure.session.save = async () => { throw new Error('checkpoint storage unavailable') }
    await expect(loadErpData({ get: vi.fn(async () => emptyPage) }, '1', Date.now, failure.session)).rejects.toThrow('checkpoint storage unavailable')
    expect(failure.session.completed).toEqual({})
  })
})
