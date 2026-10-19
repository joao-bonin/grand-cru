import { currentUser, assertSameOrigin, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { createErpReadClient } from '../../infrastructure/erp/read-client'
import { loadErpData } from '../../application/erp/synchronize'
import { AuthError } from '../../services/auth'
import { createHash } from 'node:crypto'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event, true)
  assertSameOrigin(event)
  const token = process.env.ERP_ACCESS_TOKEN
  const storeId = process.env.ERP_STORE_ID
  if (!token || !storeId || !/^\d+$/.test(storeId)) throw new AuthError(503, 'Configure token e loja do ERP no servidor para habilitar consultas de leitura.')
  // A credential/store change must never reuse another scope's cached observations.
  const scope = createHash('sha256').update(JSON.stringify([storeId, token])).digest('hex')
  return { status: await purchasingRepository(event).synchronize(session => loadErpData(createErpReadClient({ token }), storeId, Date.now, session), { scope }) }
}))
