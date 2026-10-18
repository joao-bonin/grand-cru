import { currentUser, assertSameOrigin, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { erpReadContext } from '../../utils/erp-session'
import { loadErpData } from '../../application/erp/synchronize'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event, true)
  assertSameOrigin(event)
  const { client, storeId } = erpReadContext(event)
  return { status: await purchasingRepository(event).synchronize(() => loadErpData(client, storeId)) }
}))
