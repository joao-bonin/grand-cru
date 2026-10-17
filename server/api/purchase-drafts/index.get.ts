import { z } from 'zod'
import { AuthError } from '../../services/auth'
import { currentUser, authEndpoint } from '../../utils/auth'
import { purchasingRepository } from '../../utils/purchasing'
export default defineEventHandler(event => authEndpoint(async () => {
  await currentUser(event)
  const query = getQuery(event)
  if (query.id !== undefined && !z.string().uuid().safeParse(query.id).success) throw new AuthError(400, 'Identificador de rodada inválido.')
  const drafts = await purchasingRepository(event).drafts()
  if (query.id === undefined) return { drafts }
  const draft = drafts.find(item => item.id === query.id)
  if (!draft) throw new AuthError(404, 'Rodada não encontrada.')
  return { drafts: [draft] }
}))
