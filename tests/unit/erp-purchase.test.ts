import { describe, expect, it } from 'vitest'
import { mapPurchases } from '../../server/infrastructure/erp/purchase-mapper'

describe('open purchases CV-05', () => {
  it('accepts a verified empty collection but never treats unavailable data as empty', () => {
    expect(mapPurchases([], '1')).toEqual([])
    expect(() => mapPurchases(null as never, '1')).toThrow('ERP_PURCHASE_RESPONSE_INVALID')
  })
  it('fails closed when received/cancelled units have not been reconciled with source', () => {
    expect(() => mapPurchases([{ id: 1, lojaId: 1, itens: [{ id: 2, produtoId: 5, quantidade: 2, itensNaUnidade: 6, quantidadeAtendida: 6, quantidadeCancelado: 0 }] }], '1')).toThrow('ERP_PURCHASE_UNITS_UNCONFIRMED')
  })
  it('normalizes documented open, unfulfilled package quantities into base units', () => {
    expect(mapPurchases([{ id: 1, lojaId: 1, status: 'ABERTO', dataDeEntrega: '2026-10-20', itens: [{ id: 2, produtoId: 5, status: 'ADICIONADO', quantidade: 2, itensNaUnidade: 6, quantidadeCompleta: 12, quantidadeAtendida: 0, quantidadeCancelado: 0 }] }], '1')).toEqual([{ id: 'purchase:1:2', productId: '5', storeId: '1', quantity: 12, received: 0, cancelled: 0, arrival: '2026-10-20', status: 'open' }])
  })
  it('uses item arrival, does not invent absent arrival, and ignores terminal or other-store orders', () => {
    const item = { id: 2, produtoId: 5, status: 'ADICIONADO', quantidade: 2, itensNaUnidade: 6, quantidadeAtendida: 0, quantidadeCancelado: 0 }
    expect(mapPurchases([{ id: 1, lojaId: 1, status: 'ABERTO', dataDeEntrega: '2026-10-20', itens: [{ ...item, previsaoEntrega: '2026-10-19' }] }], '1')[0]?.arrival).toBe('2026-10-19')
    expect(mapPurchases([{ id: 1, lojaId: 1, status: 'ABERTO', itens: [item] }], '1')[0]?.arrival).toBeNull()
    expect(mapPurchases([{ lojaId: 1, status: 'CANCELADO' }, { lojaId: 1, status: 'ATENDIDO' }, { lojaId: 1, status: 'ENCERRADO' }, { lojaId: 1, status: 'RECUSADO' }, { lojaId: 2, status: 'UNKNOWN' }], '1')).toEqual([])
  })
  it.each([
    { quantidade: 2, itensNaUnidade: 6, quantidadeCompleta: 10, quantidadeAtendida: 0, quantidadeCancelado: 0 },
    { quantidade: 2, itensNaUnidade: 6, quantidadeAtendida: 1, quantidadeCancelado: 0 },
    { quantidade: 2, itensNaUnidade: 6, quantidadeAtendida: 0 },
    { quantidade: 2, itensNaUnidade: 0, quantidadeAtendida: 0, quantidadeCancelado: 0 },
  ])('rejects contradictory or ambiguous quantities %j', (item) => {
    expect(() => mapPurchases([{ id: 1, lojaId: 1, status: 'ABERTO', itens: [{ id: 2, produtoId: 5, status: 'ADICIONADO', ...item }] }], '1')).toThrow(/^ERP_PURCHASE_/)
  })

})
