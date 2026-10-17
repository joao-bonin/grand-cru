import type { Product, Supplier } from '../../../shared/types/replenishment'
import { id, number, record } from './values'

export function mapCatalog(rawProducts: unknown[], rawSuppliers: unknown[], storeId: string): { products: Product[], suppliers: Supplier[], issues: string[] } {
  const products: Product[] = []
  const suppliers: Supplier[] = []
  const issues: string[] = []
  for (const raw of rawSuppliers) {
    try {
      const row = record(raw)
      if (typeof row.nome !== 'string') throw new Error('missing name')
      suppliers.push({ id: id(row.id), name: row.nome, leadDays: number(row.prazoDeEntrega) })
    } catch { issues.push('SUPPLIER_ID_OR_FIELDS_INVALID') }
  }
  for (const raw of rawProducts) {
    try {
      const row = record(raw)
      if (typeof row.descricao !== 'string') throw new Error('missing description')
      const productId = id(row.id)
      const stocks = Array.isArray(row.estoqueDoProduto) ? row.estoqueDoProduto.map(record) : []
      const stock = stocks.find(stock => id(stock.lojaId) === storeId)
      const supplierId = row.fornecedorId == null ? null : id(row.fornecedorId)
      const pack = number(row.itensEmbalagem)
      const packSize = pack !== null && pack > 0 ? pack : null
      const purchaseUnit = typeof row.unidadeDeCompra === 'string' && row.unidadeDeCompra.trim() ? row.unidadeDeCompra : null
      products.push({ id: productId, description: row.descricao, supplierId, purchaseUnit, packSize, minimum: number(stock?.estoqueMinimo), cost: number(row.custoMedio), storeId })
      if (!supplierId || !suppliers.some(supplier => supplier.id === supplierId) || !packSize || !purchaseUnit) issues.push(`PRODUCT_PURCHASE_PARAMETERS_MISSING:${productId}`)
    } catch { issues.push('PRODUCT_ID_OR_FIELDS_INVALID') }
  }
  return { products, suppliers, issues }
}
