import type { ErpReadClient } from '../../infrastructure/erp/read-client'
import { paginateErp } from '../../infrastructure/erp/paginate'
import { mapCatalog } from '../../infrastructure/erp/catalog-mapper'
import { mapSales } from '../../infrastructure/erp/sales-mapper'
import { mapStocks } from '../../infrastructure/erp/stock-mapper'
import { mapPurchases } from '../../infrastructure/erp/purchase-mapper'
import type { ErpData, SyncDataset } from '../../../shared/types/replenishment'
import type { SyncDatasetData, SyncSession } from './checkpoints'

export async function loadErpData(client: ErpReadClient, storeId: string, now = Date.now, session?: SyncSession): Promise<ErpData> {
  const start = now()
  const bounded: ErpReadClient = { get(path, query) { if (now() - start > 50_000) throw new Error('ERP_SYNC_DEADLINE'); return client.get(path, query) } }

  async function dataset<K extends SyncDataset>(name: K, load: () => Promise<SyncDatasetData[K]>): Promise<SyncDatasetData[K]> {
    const completed = session?.completed[name]
    if (completed) return completed
    if (now() - start > 50_000) throw new Error('ERP_SYNC_DEADLINE')
    await session?.start(name)
    const data = await load()
    await session?.save(name, data)
    return data
  }

  const catalog = await dataset('catalog', async () => {
    const products = await paginateErp(bounded, '/v1/produto/produtos')
    const suppliers = await paginateErp(bounded, '/v1/pessoa/fornecedores')
    return mapCatalog(products, suppliers, storeId)
  })
  const stock = await dataset('stock', async () => ({ stocks: mapStocks(await paginateErp(bounded, '/v1/estoque/saldos'), storeId) }))
  const sales = await dataset('sales', async () => {
    const coupons = await paginateErp(bounded, '/v1/venda/cupons-fiscais')
    const returns = await paginateErp(bounded, '/v1/pdv/trocas-devolucoes')
    return mapSales(coupons, returns, storeId)
  })
  const purchases = await dataset('purchases', async () => ({ purchases: mapPurchases(await paginateErp(bounded, '/v1/compra/pedidos'), storeId) }))
  return { products: catalog.products, suppliers: catalog.suppliers, stocks: stock.stocks, sales: sales.sales, purchases: purchases.purchases, historyFrom: sales.historyFrom, issues: [...catalog.issues, ...sales.issues] }
}
