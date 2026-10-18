import { setHeader } from 'h3'
import { buildOperationalDashboard } from '../../../shared/application/operational-dashboard'
import { buildRecommendations } from '../../domain/replenishment/recommend'
import { currentUser, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'

export default defineEventHandler(event => authEndpoint(async () => {
  setHeader(event, 'Cache-Control', 'no-store')
  await currentUser(event)
  const repository = purchasingRepository(event)
  const [snapshot, policies, drafts, status] = await Promise.all([
    repository.snapshot(), repository.policies(), repository.drafts(), repository.status(),
  ])
  const recommendations = snapshot ? buildRecommendations(snapshot, policies) : []
  return buildOperationalDashboard(snapshot, recommendations, drafts, status.state)
}))
