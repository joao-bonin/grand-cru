import { currentUser, assertSameOrigin, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { createErpReadClient } from '../../infrastructure/erp/read-client'
import { loadErpData } from '../../application/erp/synchronize'
import { AuthError } from '../../services/auth'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event, true)
  assertSameOrigin(event)
  const token = process.env.ERP_ACCESS_TOKEN
  const storeId = process.env.ERP_STORE_ID
  if (!token || !storeId || !/^\d+$/.test(storeId)) throw new AuthError(503, 'Configure token e loja do ERP no servidor para habilitar consultas de leitura.')
  return { status: await purchasingRepository(event).synchronize(() => loadErpData(createErpReadClient({ token }), storeId)) }
}))
