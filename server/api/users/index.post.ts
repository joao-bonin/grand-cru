import { readBody, setResponseStatus } from 'h3'
import { AuthError, createUserInput, publicUser } from '../../services/auth'
import { hashPassword } from '../../services/passwords'
import { assertSameOrigin, authContext, authEndpoint, currentUser } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  assertSameOrigin(event)
  await currentUser(event, true)
  const parsed = createUserInput.safeParse(await readBody(event))
  if (!parsed.success) throw new AuthError(400, 'Login inválido ou senha com menos de 12 caracteres.')
  const { password, ...data } = parsed.data
  const user = await authContext(event).repository.create({ ...data, passwordHash: await hashPassword(password) })
  setResponseStatus(event, 201)
  return { user: publicUser(user) }
}))
