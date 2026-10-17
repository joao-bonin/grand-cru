import { describe, expect, it, vi } from 'vitest'
import { loadErpData } from '../../server/application/erp/synchronize'
import { ErpSyncFailure, synchronizationErrorMessage } from '../../server/application/erp/sync-failure'
import type { ErpReadClient } from '../../server/infrastructure/erp/read-client'

const paths = ['/v1/produto/produtos', '/v1/pessoa/fornecedores', '/v1/estoque/saldos', '/v1/venda/cupons-fiscais', '/v1/pdv/trocas-devolucoes', '/v1/compra/pedidos']
const sources = ['products', 'suppliers', 'stock', 'coupons', 'returns', 'purchases']
const empty = { start: 0, count: 0, total: 0, items: [] }

describe('contexto seguro das falhas de sincronização', () => {
  it.each(paths.map((path, index) => ({ path, index, source: sources[index] })))('identifica $source sem consultar fontes posteriores', async ({ path, index, source }) => {
    const get = vi.fn<ErpReadClient['get']>(async (requested) => {
      if (requested === path) throw new Error('ERP_HTTP_403')
      return empty
    })
    const failure = await loadErpData({ get }, '1').catch(error => error)
    expect(failure).toBeInstanceOf(ErpSyncFailure)
    expect(failure.source).toBe(source)
    expect(failure.message).toBe('ERP_HTTP_403')
    expect(get).toHaveBeenCalledTimes(index + 1)
  })

  it('identifica o estoque quando o saldo é inválido no mapeamento', async () => {
    const get = vi.fn<ErpReadClient['get']>(async path => path === paths[2]
      ? { start: 0, count: 1, total: 1, items: [{ lojaId: 1, produtoId: 1, localId: 1, saldo: null }] }
      : empty)
    const failure = await loadErpData({ get }, '1').catch(error => error)
    expect(failure).toBeInstanceOf(ErpSyncFailure)
    expect(failure.source).toBe('stock')
    expect(failure.message).toBe('ERP_STOCK_BALANCE_INVALID')
  })

  it('descarta texto privado e causa de falhas inesperadas', async () => {
    const get = vi.fn<ErpReadClient['get']>(async () => { throw new Error('synthetic-private-token', { cause: 'synthetic-private-password' }) })
    const failure = await loadErpData({ get }, '1').catch(error => error)
    expect(failure.message).toBe('ERP_SOURCE_INVALID')
    expect(failure.cause).toBeUndefined()
    expect(JSON.stringify(failure)).not.toContain('synthetic-private')
    expect(synchronizationErrorMessage(failure)).not.toContain('synthetic-private')
  })

  it('mantém o código de autenticação pendente compatível com a interface', async () => {
    const get = vi.fn<ErpReadClient['get']>(async () => { throw new Error('ERP_AUTHENTICATION_PENDING') })
    const failure = await loadErpData({ get }, '1').catch(error => error)
    expect(synchronizationErrorMessage(failure)).toBe('ERP_AUTHENTICATION_PENDING')
    expect(get).toHaveBeenCalledTimes(1)
  })
})
