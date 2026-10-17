import { currentUser, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event)
  const repository = purchasingRepository(event)
  const [status, snapshot] = await Promise.all([repository.status(), repository.snapshot()])
  return { status, snapshot: snapshot ? { id: snapshot.id, createdAt: snapshot.createdAt } : null, configured: Boolean(process.env.ERP_ACCESS_TOKEN && process.env.ERP_STORE_ID) }
}))
