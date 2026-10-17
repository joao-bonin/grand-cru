import type { Stock } from '../../../shared/types/replenishment'
import { date, id, number, record } from './values'

export function mapStocks(raw: unknown[], storeId: string): Stock[] {
  return raw.map(record).filter(row => id(row.lojaId) === storeId).map((row) => {
    const physical = number(row.saldo)
    if (physical === null) throw new Error('ERP_STOCK_BALANCE_INVALID')
    return { productId: id(row.produtoId), storeId, locationId: id(row.localId), physical, reserved: null, blocked: null, disjoint: false, updatedAt: date(row.atualizadoEm) }
  })
}
