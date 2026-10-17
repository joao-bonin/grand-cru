import type { Sale } from '../../../shared/types/replenishment'
import { date, id, number, record } from './values'

/** Coupon-only ingestion avoids counting an associated invoice as a second sale. */
export function mapSales(rawCupons: unknown[], _rawReturns: unknown[], storeId: string): { sales: Sale[], historyFrom: null, issues: string[] } {
  const sales = new Map<string, Sale>()
  for (const raw of rawCupons) {
    const coupon = record(raw)
    if (id(coupon.lojaId) !== storeId) continue
    const documentId = id(coupon.id)
    const saleDate = date(coupon.dataVenda)
    if (!saleDate || !Array.isArray(coupon.itensVenda) || typeof coupon.cancelada !== 'boolean') throw new Error('ERP_SALE_FIELDS_INVALID')
    for (const itemRaw of coupon.itensVenda) {
      const item = record(itemRaw)
      const quantity = number(item.quantidadeVenda)
      if (quantity === null || quantity < 0 || !['1', '2'].includes(String(item.tipo))) throw new Error('ERP_SALE_FIELDS_INVALID')
      const sale: Sale = { id: `coupon:${documentId}:${id(item.id)}`, documentId, productId: id(item.produtoId), storeId, date: saleDate, quantity, kind: 'sale', cancelled: coupon.cancelada || String(item.tipo) === '2', originalSaleId: null }
      const previous = sales.get(sale.id)
      if (previous && JSON.stringify(previous) !== JSON.stringify(sale)) throw new Error('ERP_SALE_IDENTITY_CONFLICT')
      sales.set(sale.id, sale)
    }
  }
  // Neither oldest observed coupon nor an empty returns response proves complete history/reconciliation.
  return { sales: [...sales.values()], historyFrom: null, issues: ['SALES_HISTORY_COVERAGE_UNCONFIRMED', 'RETURNS_RECONCILIATION_UNCONFIRMED'] }
}
