import { describe, expect, it, vi } from 'vitest'
import { reviewDraft } from '../../server/application/purchases/review-draft'
import type { Recommendation } from '../../shared/types/replenishment'
import type { PurchasingRepository } from '../../server/infrastructure/persistence/erp-repository'
const snapshotId = '11111111-1111-4111-8111-111111111111'
const row = { product: { id: 'sku', storeId: '1', description: 'Vinho', purchaseUnit: 'CX' }, snapshotId, suggested: 12, policy: { supplierId: 'f1', packSize: 6, cost: 10, version: 1 } } as Recommendation
const command = { key: 'round-unique', snapshotId, state: 'reviewed', items: [{ productId: 'sku', storeId: '1', adjusted: 18, expectedPolicyVersion: 1 }] }
const deps = () => ({ saveDraft: vi.fn(async d => ({ ...d, version: 1 })), drafts: vi.fn(async () => []), findDraft: vi.fn(async () => null) }) as unknown as PurchasingRepository

describe('rodada estritamente local', () => {
  it('preserva sugestão, decisão, autor, snapshot e total', async () => {
    const draft = await reviewDraft(command, 'admin', [row], deps())
    expect(draft.items[0]).toEqual({ productId: 'sku', storeId: '1', supplierId: 'f1', description: 'Vinho', suggested: 12, adjusted: 18, policyVersion: 1, packSize: 6, unitCost: 10, reference: row })
    expect(draft.total).toBe(180)
    expect(draft.author).toBe('admin')
    expect(draft.snapshotId).toBe(snapshotId)
    expect(draft.state).toBe('reviewed')
  })
  it.each([-1, Infinity, NaN, 7])('rejeita quantidade inválida %s', async adjusted => {
    const repo = deps()
    await expect(reviewDraft({ ...command, items: [{ ...command.items[0], adjusted }] }, 'admin', [row], repo)).rejects.toMatchObject({ statusCode: 400 })
    expect(repo.saveDraft).not.toHaveBeenCalled()
  })
  it('recusa snapshot antigo, item repetido e recomendação indeterminada', async () => {
    await expect(reviewDraft(command, 'admin', [{ ...row, snapshotId: 'other' }], deps())).rejects.toMatchObject({ statusCode: 409 })
    await expect(reviewDraft({ ...command, items: [command.items[0], command.items[0]] }, 'admin', [row], deps())).rejects.toMatchObject({ statusCode: 400 })
    await expect(reviewDraft(command, 'admin', [{ ...row, suggested: null }], deps())).rejects.toMatchObject({ statusCode: 400 })
  })
  it('não inventa custo ausente', async () => {
    const draft = await reviewDraft(command, 'admin', [{ ...row, policy: { ...row.policy!, cost: null } }], deps())
    expect(draft.total).toBeNull()
  })
})


describe('rastreabilidade e repetição de confirmação', () => {
  it('guarda os parâmetros usados sem depender de políticas futuras', async () => {
    const draft = await reviewDraft(command, 'admin', [row], deps())
    expect(draft.items[0]!.reference!.policy!.packSize).toBe(6)
    expect(draft.items[0]!.reference!.snapshotId).toBe(snapshotId)
  })
  it('repetição idêntica devolve a rodada original mesmo após mudança da fonte', async () => {
    const repo = deps()
    const original = await reviewDraft(command, 'admin', [row], repo)
    vi.mocked(repo.findDraft).mockResolvedValue(original)
    expect(await reviewDraft(command, 'admin', [], repo)).toEqual(original)
    await expect(reviewDraft({ ...command, items: [{ ...command.items[0], adjusted: 24 }] }, 'admin', [row], repo)).rejects.toMatchObject({ statusCode: 409 })
    await expect(reviewDraft(command, 'another', [row], repo)).rejects.toMatchObject({ statusCode: 409 })
  })
  it('bloqueia total que não pode ser representado com precisão monetária', async () => {
    await expect(reviewDraft(command, 'admin', [{ ...row, policy: { ...row.policy!, cost: Number.MAX_VALUE } }], deps())).rejects.toMatchObject({ statusCode: 400 })
  })
})


it('bloqueia revisão após alteração de parâmetros mesmo com snapshot igual', async () => {
  const repo = deps()
  await expect(reviewDraft(command, 'admin', [{ ...row, policy: { ...row.policy!, version: 2 } }], repo)).rejects.toMatchObject({ statusCode: 409 })
  expect(repo.saveDraft).not.toHaveBeenCalled()
})
