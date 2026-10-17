import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Recommendation } from '../../../shared/types/replenishment'
import type { PurchasingRepository } from '../../infrastructure/persistence/erp-repository'
import { AuthError } from '../../services/auth'

const inputSchema = z.object({
  id: z.string().uuid().optional(), key: z.string().min(8).max(100), snapshotId: z.string().uuid(),
  version: z.number().int().nonnegative().default(0), state: z.enum(['draft', 'reviewed']),
  items: z.array(z.object({ productId: z.string().min(1).max(100), storeId: z.string().min(1).max(100), adjusted: z.number().finite().nonnegative().max(1e9), expectedPolicyVersion: z.number().int().nonnegative() }).strict()).min(1).max(500),
}).strict()
export async function reviewDraft(input: unknown, author: string, recommendations: Recommendation[], repository: PurchasingRepository) {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) throw new AuthError(400, 'Informe uma rodada válida com quantidades não negativas.')
  const value = parsed.data
  const existing = await repository.findDraft(value.key)
  if (!value.id && existing) {
    const identity = (items: Array<{storeId: string, productId: string, adjusted: number, expectedPolicyVersion?: number, policyVersion?: number}>) => JSON.stringify(items.map(i => [i.storeId, i.productId, i.adjusted, i.expectedPolicyVersion ?? i.policyVersion]))
    if (existing.author !== author || existing.snapshotId !== value.snapshotId || existing.state !== value.state || identity(existing.items) !== identity(value.items)) throw new AuthError(409, 'Chave de rodada já utilizada por outra revisão.')
    return existing
  }
  const seen = new Set<string>()
  const items = value.items.map(item => {
    const identity = JSON.stringify([item.storeId, item.productId])
    if (seen.has(identity)) throw new AuthError(400, 'Um produto não pode aparecer duas vezes na rodada.')
    seen.add(identity)
    const recommendation = recommendations.find(r => r.product.id === item.productId && r.product.storeId === item.storeId)
    if (!recommendation || recommendation.snapshotId !== value.snapshotId) throw new AuthError(409, 'Os dados foram atualizados. Revise a rodada.')
    const policy = recommendation.policy
    if (!policy || recommendation.suggested === null || !policy.supplierId || !recommendation.product.purchaseUnit) throw new AuthError(400, 'Corrija parâmetros e pendências antes de preparar a compra.')
    if (policy.version !== item.expectedPolicyVersion) throw new AuthError(409, 'Os parâmetros foram atualizados. Revise a rodada.')
    const packages = item.adjusted / policy.packSize
    if (Math.abs(packages - Math.round(packages)) > 1e-8) throw new AuthError(400, 'A quantidade deve respeitar a embalagem de compra.')
    return { productId: item.productId, storeId: item.storeId, adjusted: item.adjusted, policyVersion: policy.version, supplierId: policy.supplierId, description: recommendation.product.description, suggested: recommendation.suggested, packSize: policy.packSize, unitCost: policy.cost, reference: structuredClone(recommendation) }
  })
  const previous = value.id ? (await repository.drafts()).find(draft => draft.id === value.id) : undefined
  if (value.id && !previous) throw new AuthError(404, 'Rodada não encontrada.')
  if (previous && previous.author !== author) throw new AuthError(403, 'Somente o autor pode alterar esta rodada.')
  const hasUnknownCost = items.some(item => item.unitCost === null)
  const total = hasUnknownCost ? null : Math.round(items.reduce((sum, item) => sum + item.adjusted * item.unitCost!, 0) * 100) / 100
  if (total !== null && (!Number.isFinite(total) || !Number.isSafeInteger(Math.round(total * 100)))) throw new AuthError(400, 'Valor da rodada excede a precisão permitida.')
  return repository.saveDraft({ id: value.id ?? randomUUID(), key: value.key, author, snapshotId: value.snapshotId, createdAt: previous?.createdAt ?? new Date().toISOString(), state: value.state, version: value.version, items, total }, value.version, value.snapshotId)
}
