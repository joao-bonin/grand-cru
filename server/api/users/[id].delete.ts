import { getRouterParam } from 'h3'
import { AuthError } from '../../services/auth'
import { assertSameOrigin, authContext, authEndpoint, clearAuthSession, currentUser } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  assertSameOrigin(event)
  const actor = await currentUser(event, true)
  const id = getRouterParam(event, 'id')
  if (!id) throw new AuthError(400, 'Usuário inválido.')
  await authContext(event).repository.remove(id)
  if (actor.id === id) clearAuthSession(event)
  return { success: true }
}))
