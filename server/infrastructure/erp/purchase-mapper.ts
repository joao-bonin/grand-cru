import type { OpenPurchase } from '../../../shared/types/replenishment'
import { date, id, number, record } from './values'

export function mapPurchases(raw: unknown[], storeId: string): OpenPurchase[] {
  if (!Array.isArray(raw)) throw new Error('ERP_PURCHASE_RESPONSE_INVALID')
  const purchases: OpenPurchase[] = []
  for (const order of raw.map(record).filter(row => id(row.lojaId) === storeId)) {
    if (['CANCELADO', 'ATENDIDO', 'ENCERRADO', 'RECUSADO'].includes(String(order.status))) continue
    if (order.status !== 'ABERTO' || !Array.isArray(order.itens)) throw new Error('ERP_PURCHASE_UNITS_UNCONFIRMED')
    for (const item of order.itens.map(record)) {
      // SPEC_DEVIATION: partial fulfillment is blocked pending unit reconciliation (G1).
      // Swagger defines packages and complete units, but not received/cancelled units.
      if (item.status !== 'ADICIONADO' || item.quantidadeAtendida !== 0 || item.quantidadeCancelado !== 0) throw new Error('ERP_PURCHASE_UNITS_UNCONFIRMED')
      const packages = number(item.quantidade)
      const unitsPerPackage = number(item.itensNaUnidade)
      if (packages === null || packages < 0 || unitsPerPackage === null || unitsPerPackage <= 0) throw new Error('ERP_PURCHASE_QUANTITY_INVALID')
      const quantity = packages * unitsPerPackage
      if (!Number.isFinite(quantity) || (item.quantidadeCompleta != null && (number(item.quantidadeCompleta) === null || Math.abs((item.quantidadeCompleta as number) - quantity) > 1e-8))) throw new Error('ERP_PURCHASE_QUANTITY_INVALID')
      purchases.push({ id: `purchase:${id(order.id)}:${id(item.id)}`, productId: id(item.produtoId), storeId, quantity, received: 0, cancelled: 0, arrival: date(item.previsaoEntrega) ?? date(order.dataDeEntrega), status: 'open' })
    }
  }
  return purchases
}
