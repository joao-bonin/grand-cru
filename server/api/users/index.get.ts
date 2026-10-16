import { publicUser } from '../../services/auth'
import { authContext, authEndpoint, currentUser } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event, true)
  return { users: (await authContext(event).repository.list()).map(publicUser) }
}))
