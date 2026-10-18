import { z } from 'zod'
import { queryRecommendations } from '../../../shared/application/replenishment-query'
import { currentUser, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { buildRecommendations } from '../../domain/replenishment/recommend'
import { AuthError } from '../../services/auth'
const querySchema = z.object({
  product: z.string().max(100).optional(), supplier: z.string().max(100).optional(),
  risk: z.enum(['true', 'false']).optional(), issues: z.enum(['true', 'false']).optional(),
  actionable: z.enum(['true', 'false']).optional(),
  start: z.coerce.number().int().nonnegative().max(1_000_000).optional(), count: z.coerce.number().int().min(1).max(1000).optional(),
}).strict()
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event)
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) throw new AuthError(400, 'Filtros ou paginação inválidos.')
  const query = parsed.data
  const repository = purchasingRepository(event)
  const [snapshot, policies] = await Promise.all([repository.snapshot(), repository.policies()])
  const items = snapshot ? buildRecommendations(snapshot, policies) : []
  const page = queryRecommendations(items, { ...query, risk: query.risk === undefined ? undefined : query.risk === 'true', issues: query.issues === undefined ? undefined : query.issues === 'true', actionable: query.actionable === undefined ? undefined : query.actionable === 'true' })
  return { ...page, snapshotId: snapshot?.id ?? null, policies, issues: snapshot?.data.issues ?? ['Dados do ERP ainda não sincronizados.'] }
}))
