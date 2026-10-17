import { AuthError } from '../../../services/auth'
import { currentUser, assertSameOrigin, authEndpoint } from '../../../utils/auth'
import { purchasingRepository } from '../../../utils/purchasing'
import { validatePolicy } from '../../../domain/replenishment/policy'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event, true)
  assertSameOrigin(event)
  let policy
  try { policy = validatePolicy(await readBody(event)) } catch { throw new AuthError(400, 'Informe todos os parâmetros da política com valores válidos.') }
  if (getRouterParam(event, 'id') !== policy.productId) throw new AuthError(400, 'Produto inconsistente.')
  return { policy: await purchasingRepository(event).savePolicy(policy) }
}))
