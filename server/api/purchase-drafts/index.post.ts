import { currentUser, assertSameOrigin, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { reviewDraft } from '../../application/purchases/review-draft'
import { buildRecommendations } from '../../domain/replenishment/recommend'
import { AuthError } from '../../services/auth'
export default defineEventHandler(event => authEndpoint(async () => {
  const user = await currentUser(event, true)
  assertSameOrigin(event)
  const repo = purchasingRepository(event)
  const [snapshot, policies] = await Promise.all([repo.snapshot(), repo.policies()])
  if (!snapshot) throw new AuthError(409, 'Sincronize os dados antes de revisar uma rodada.')
  return { draft: await reviewDraft(await readBody(event), user.id, buildRecommendations(snapshot, policies), repo) }
}))
