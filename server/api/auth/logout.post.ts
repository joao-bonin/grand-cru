import { assertSameOrigin, authContext, authEndpoint, clearAuthSession, currentUser } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  assertSameOrigin(event)
  const user = await currentUser(event)
  await authContext(event).service.logout(user)
  clearAuthSession(event)
  return { success: true }
}))
