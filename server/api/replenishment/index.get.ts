import { z } from 'zod'
import { currentUser, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
import { buildRecommendations } from '../../domain/replenishment/recommend'
import { AuthError } from '../../services/auth'
const querySchema = z.object({
  product: z.string().max(100).optional(), supplier: z.string().max(100).optional(),
  risk: z.enum(['true', 'false']).optional(), issues: z.enum(['true', 'false']).optional(),
  start: z.coerce.number().int().nonnegative().max(1_000_000).optional(), count: z.coerce.number().int().min(1).max(1000).optional(),
}).strict()
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event)
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) throw new AuthError(400, 'Filtros ou paginação inválidos.')
  const query = parsed.data
  const repository = purchasingRepository(event)
  const [snapshot, policies] = await Promise.all([repository.snapshot(), repository.policies()])
  let items = snapshot ? buildRecommendations(snapshot, policies) : []
  if (query.product) items = items.filter(item => `${item.product.id} ${item.product.description}`.toLowerCase().includes(query.product!.toLowerCase()))
  if (query.supplier) items = items.filter(item => (item.policy?.supplierId ?? item.product.supplierId) === query.supplier)
  if (query.risk !== undefined) items = items.filter(item => Boolean(item.ruptureDate) === (query.risk === 'true'))
  if (query.issues !== undefined) items = items.filter(item => Boolean(item.issues.length) === (query.issues === 'true'))
  const total = items.length
  const start = query.start ?? 0
  const count = query.count ?? total
  return { items: items.slice(start, start + count), start, count, total, snapshotId: snapshot?.id ?? null, policies, issues: snapshot?.data.issues ?? ['Dados do ERP ainda não sincronizados.'] }
}))
