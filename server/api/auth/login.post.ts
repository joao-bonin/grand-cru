import { getRequestIP, readBody } from 'h3'
import { loginInput, AuthError } from '../../services/auth'
import { assertSameOrigin, authContext, authEndpoint, setSession } from '../../utils/auth'

export default defineEventHandler(event => authEndpoint(async () => {
  assertSameOrigin(event)
  const parsed = loginInput.safeParse(await readBody(event))
  if (!parsed.success) throw new AuthError(400, 'Informe um login e uma senha válidos.')
  const { repository, service } = authContext(event)
  await repository.consumeLoginAttempt(`ip:${getRequestIP(event) ?? 'unknown'}`)
  await repository.consumeLoginAttempt(`login:${parsed.data.login}`)
  const result = await service.login(parsed.data)
  setSession(event, result.token)
  return { user: result.user }
}))
