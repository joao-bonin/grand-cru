import { authEndpoint, currentUser } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { loadBusinessDashboard } from '../../application/dashboard/load-dashboard'

export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event)
  return loadBusinessDashboard(purchasingRepository(event))
}))
