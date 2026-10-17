import { describe, expect, it, vi } from 'vitest'
import { loadErpData } from '../../server/application/erp/synchronize'
import type { ErpReadClient } from '../../server/infrastructure/erp/read-client'

const emptyPage = { start: 0, count: 0, total: 0, items: [] }

describe('orçamento da sincronização do ERP', () => {
  it('conclui 222 consultas para o volume observado mesmo após 50 segundos', async () => {
    let elapsed = 0
    const products = Array.from({ length: 3077 }, (_, index) => ({
      id: index + 1, descricao: `Produto sintético ${index + 1}`, fornecedorId: 1,
      itensEmbalagem: 6, unidadeDeCompra: 'CX',
    }))
    const suppliers = Array.from({ length: 55 }, (_, index) => ({ id: index + 1, nome: `Fornecedor sintético ${index + 1}` }))
    const stocks = Array.from({ length: 18612 }, (_, index) => ({
      produtoId: index % products.length + 1, lojaId: 1, localId: index + 1, saldo: index + 1,
    }))
    const sources: Record<string, unknown[]> = {
      '/v1/produto/produtos': products,
      '/v1/pessoa/fornecedores': suppliers,
      '/v1/estoque/saldos': stocks,
      '/v1/venda/cupons-fiscais': [],
      '/v1/pdv/trocas-devolucoes': [],
      '/v1/compra/pedidos': [],
    }
    const get = vi.fn<ErpReadClient['get']>(async (path, query) => {
      elapsed += 300
      const rows = sources[path]!
      const start = Number(query?.start)
      const items = rows.slice(start, start + Number(query?.count))
      return { start, count: items.length, total: rows.length, items }
    })

    const data = await loadErpData({ get }, '1', () => elapsed)

    expect(get).toHaveBeenCalledTimes(222)
    expect(elapsed).toBe(66_600)
    expect(data.products.map(product => product.id)).toEqual(products.map(product => String(product.id)))
    expect(data.suppliers).toHaveLength(55)
    expect(data.stocks.map(stock => stock.locationId)).toEqual(stocks.map(stock => String(stock.localId)))
    expect(data.stocks.map(stock => stock.physical)).toEqual(stocks.map(stock => stock.saldo))
  })

  it('não inicia uma consulta exatamente no limite de 180 segundos', async () => {
    const get = vi.fn<ErpReadClient['get']>()
    const now = vi.fn().mockReturnValueOnce(0).mockReturnValue(180_000)

    await expect(loadErpData({ get }, '1', now)).rejects.toThrow('ERP_SYNC_DEADLINE')
    expect(get).not.toHaveBeenCalled()
  })

  it('aceita a última resposta imediatamente antes do limite', async () => {
    let elapsed = 0
    const get = vi.fn<ErpReadClient['get']>(async () => {
      elapsed = 179_999
      return emptyPage
    })

    await expect(loadErpData({ get }, '1', () => elapsed)).resolves.toMatchObject({ products: [], stocks: [] })
    expect(get).toHaveBeenCalledTimes(6)
  })

  it.each([180_000, 180_001])('rejeita resposta em %i ms sem consultar a próxima fonte', async (finishedAt) => {
    let elapsed = 0
    const get = vi.fn<ErpReadClient['get']>(async () => {
      elapsed = finishedAt
      return emptyPage
    })

    await expect(loadErpData({ get }, '1', () => elapsed)).rejects.toThrow('ERP_SYNC_DEADLINE')
    expect(get).toHaveBeenCalledExactlyOnceWith('/v1/produto/produtos', { start: 0, count: 100 })
  })

  it('rejeita uma resposta final tardia em vez de publicar a carga', async () => {
    let elapsed = 0
    let requests = 0
    const get = vi.fn<ErpReadClient['get']>(async () => {
      requests++
      elapsed = requests === 6 ? 180_000 : 0
      return emptyPage
    })

    await expect(loadErpData({ get }, '1', () => elapsed)).rejects.toThrow('ERP_SYNC_DEADLINE')
    expect(get).toHaveBeenCalledTimes(6)
    expect(get).toHaveBeenLastCalledWith('/v1/compra/pedidos', { start: 0, count: 100 })
  })
})
