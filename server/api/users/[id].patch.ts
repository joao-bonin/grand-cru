import { getRouterParam, readBody } from 'h3'
import { AuthError, publicUser, updateUserInput } from '../../services/auth'
import { hashPassword } from '../../services/passwords'
import { assertSameOrigin, authContext, authEndpoint, currentUser } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  assertSameOrigin(event)
  await currentUser(event, true)
  const parsed = updateUserInput.safeParse(await readBody(event))
  const id = getRouterParam(event, 'id')
  if (!parsed.success || !id) throw new AuthError(400, 'Dados de usuário inválidos.')
  const { password, ...data } = parsed.data
  const user = await authContext(event).repository.update(id, { ...data, ...(password ? { passwordHash: await hashPassword(password) } : {}) })
  return { user: publicUser(user) }
}))
