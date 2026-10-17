import type { ErpReadClient } from '../../infrastructure/erp/read-client'
import { paginateErp } from '../../infrastructure/erp/paginate'
import { mapCatalog } from '../../infrastructure/erp/catalog-mapper'
import { mapSales } from '../../infrastructure/erp/sales-mapper'
import { mapStocks } from '../../infrastructure/erp/stock-mapper'
import { mapPurchases } from '../../infrastructure/erp/purchase-mapper'
import { ErpSyncFailure, type ErpSyncSource } from './sync-failure'
import type { ErpData } from '../../../shared/types/replenishment'

const ERP_SYNC_BUDGET_MS = 180_000

async function fromSource<T>(source: ErpSyncSource, operation: () => T | Promise<T>): Promise<T> {
  try { return await operation() }
  catch (error) {
    // Remote errors may contain private data; deliberately discard their cause.
    throw new ErpSyncFailure(source, error)
  }
}

export async function loadErpData(client: ErpReadClient, storeId: string, now = Date.now): Promise<ErpData> {
  const start = now()
  const assertWithinBudget = () => {
    if (now() - start >= ERP_SYNC_BUDGET_MS) throw new Error('ERP_SYNC_DEADLINE')
  }
  const bounded: ErpReadClient = {
    async get(path, query) {
      assertWithinBudget()
      const response = await client.get(path, query)
      assertWithinBudget()
      return response
    },
  }
  const products = await fromSource('products', () => paginateErp(bounded, '/v1/produto/produtos'))
  const suppliers = await fromSource('suppliers', () => paginateErp(bounded, '/v1/pessoa/fornecedores'))
  const stock = await fromSource('stock', () => paginateErp(bounded, '/v1/estoque/saldos'))
  const coupons = await fromSource('coupons', () => paginateErp(bounded, '/v1/venda/cupons-fiscais'))
  const returns = await fromSource('returns', () => paginateErp(bounded, '/v1/pdv/trocas-devolucoes'))
  const purchases = await fromSource('purchases', () => paginateErp(bounded, '/v1/compra/pedidos'))
  const catalog = await fromSource('products', () => mapCatalog(products, suppliers, storeId))
  const sales = await fromSource('coupons', () => mapSales(coupons, returns, storeId))
  return { products: catalog.products, suppliers: catalog.suppliers, stocks: await fromSource('stock', () => mapStocks(stock, storeId)), sales: sales.sales, purchases: await fromSource('purchases', () => mapPurchases(purchases, storeId)), historyFrom: sales.historyFrom, issues: [...catalog.issues, ...sales.issues] }
}
