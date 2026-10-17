import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PurchaseDraftEditor from '../../app/components/PurchaseDraftEditor.vue'
import type { PurchaseDraft } from '../../shared/types/replenishment'
const draft: PurchaseDraft = { id: 'd1', key: 'key1', author: 'ana', createdAt: '2026-10-16T12:00:00Z', snapshotId: 'snapshot-1', version: 1, state: 'draft', total: 240, items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', description: 'Vinho', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }] }
describe('US08 revisão estritamente local', () => {
  it('preserva sugestão e emite ajuste 18 com chave, snapshot e versão', async () => {
    const wrapper = mount(PurchaseDraftEditor, { props: { draft, canEdit: true } })
    await wrapper.get('input[type="number"]').setValue('18')
    expect(wrapper.text()).toContain('Sugestão original: 12')
    expect(wrapper.text()).toContain('360')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[{ id: 'd1', key: 'key1', snapshotId: 'snapshot-1', version: 1, state: 'draft', items: [{ productId: 'p1', storeId: 's1', adjusted: 18, expectedPolicyVersion: 1 }] }]])
    expect(draft.items[0]!.adjusted).toBe(12)
  })
  it('envia a versão da política usada na revisão sem substituí-la por versão atual', async () => {
    const wrapper = mount(PurchaseDraftEditor, { props: { draft: { ...draft, items: [{ ...draft.items[0]!, policyVersion: 7 }] }, canEdit: true } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')![0]![0]).toMatchObject({ items: [{ productId: 'p1', storeId: 's1', adjusted: 12, expectedPolicyVersion: 7 }] })
  })
  it('exige confirmação local, mantém edição no conflito e valida embalagem', async () => {
    const wrapper = mount(PurchaseDraftEditor, { props: { draft, canEdit: true } })
    await wrapper.get('input[type="number"]').setValue('13')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('embalagem')
    await wrapper.get('input[type="number"]').setValue('18')
    await wrapper.get('[data-review]').trigger('click')
    expect(wrapper.emitted('save')).toBeUndefined()
    await wrapper.get('[name="confirmLocal"]').setValue(true)
    await wrapper.get('[data-review]').trigger('click')
    expect(wrapper.emitted('save')![0]![0]).toMatchObject({ state: 'reviewed', items: [{ adjusted: 18 }] })
    await wrapper.setProps({ error: 'Conflito de versão. Atualize a rodada.' })
    expect((wrapper.get('input[type="number"]').element as HTMLInputElement).value).toBe('18')
  })
  it('agrupa itens por fornecedor sem misturar a revisão', () => {
    const second = { ...draft.items[0]!, productId: 'p2', supplierId: 'f2', description: 'Espumante' }
    const wrapper = mount(PurchaseDraftEditor, { props: { draft: { ...draft, items: [...draft.items, second] }, canEdit: true } })
    const groups = wrapper.findAll('fieldset > section')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.get('h3').text()).toBe('Fornecedor f1')
    expect(groups[0]!.get('article h4').text()).toBe('Vinho · p1 / s1')
    expect(groups[0]!.text()).not.toContain('Espumante')
    expect(groups[1]!.get('h3').text()).toBe('Fornecedor f2')
    expect(groups[1]!.get('article h4').text()).toBe('Espumante · p2 / s1')
    expect(groups[1]!.text()).not.toContain('Vinho')
  })
  it('remove itens e bloqueia salvar rodada vazia ou acesso de leitura', async () => {
    const wrapper = mount(PurchaseDraftEditor, { props: { draft, canEdit: true } })
    await wrapper.get('[data-remove]').trigger('click')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    await wrapper.setProps({ canEdit: false })
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Nenhum pedido será enviado ao ERP')
  })
})
