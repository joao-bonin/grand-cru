import { describe, expect, it } from 'vitest'
import { mapStocks } from '../../server/infrastructure/erp/stock-mapper'

describe('stock availability CV-05', () => {
  it('preserves each location while keeping unknown reservations and blocks indeterminate', () => {
    expect(mapStocks([{ lojaId: 1, produtoId: 5, localId: 1, saldo: 20, atualizadoEm: '2026-10-15T12:00:00Z' }, { lojaId: 1, produtoId: 5, localId: 2, saldo: -2 }, { lojaId: 2, produtoId: 5, localId: 1, saldo: 99 }], '1')).toEqual([{ productId: '5', storeId: '1', locationId: '1', physical: 20, reserved: null, blocked: null, disjoint: false, updatedAt: '2026-10-15T12:00:00Z' }, { productId: '5', storeId: '1', locationId: '2', physical: -2, reserved: null, blocked: null, disjoint: false, updatedAt: null }])
  })
  it('never turns an absent balance into zero', () => {
    expect(() => mapStocks([{ lojaId: 1, produtoId: 5, localId: 1 }], '1')).toThrow('ERP_STOCK_BALANCE_INVALID')
  })
})
