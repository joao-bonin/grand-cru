import type { ErpReadClient } from '../../infrastructure/erp/read-client'
import { paginateErp } from '../../infrastructure/erp/paginate'
import { mapCatalog } from '../../infrastructure/erp/catalog-mapper'
import { mapSales } from '../../infrastructure/erp/sales-mapper'
import { mapStocks } from '../../infrastructure/erp/stock-mapper'
import { mapPurchases } from '../../infrastructure/erp/purchase-mapper'
import type { ErpData } from '../../../shared/types/replenishment'

export async function loadErpData(client: ErpReadClient, storeId: string, now = Date.now): Promise<ErpData> {
  const start = now()
  const bounded: ErpReadClient = { get(path, query) { if (now() - start > 50_000) throw new Error('ERP_SYNC_DEADLINE'); return client.get(path, query) } }
  const products = await paginateErp(bounded, '/v1/produto/produtos')
  const suppliers = await paginateErp(bounded, '/v1/pessoa/fornecedores')
  const stock = await paginateErp(bounded, '/v1/estoque/saldos')
  const coupons = await paginateErp(bounded, '/v1/venda/cupons-fiscais')
  const returns = await paginateErp(bounded, '/v1/pdv/trocas-devolucoes')
  const purchases = await paginateErp(bounded, '/v1/compra/pedidos')
  const catalog = mapCatalog(products, suppliers, storeId)
  const sales = mapSales(coupons, returns, storeId)
  return { products: catalog.products, suppliers: catalog.suppliers, stocks: mapStocks(stock, storeId), sales: sales.sales, purchases: mapPurchases(purchases, storeId), historyFrom: sales.historyFrom, issues: [...catalog.issues, ...sales.issues] }
}
