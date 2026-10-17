import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReplenishmentPolicyEditor from '../../app/components/ReplenishmentPolicyEditor.vue'
import type { Policy } from '../../shared/types/replenishment'
const policy: Policy = { productId: 'p1', storeId: 's1', windowDays: 90, leadDays: 10, reviewDays: 7, safetyUnits: 6, minimum: 0, packSize: 6, cost: 20, supplierId: 'f1', version: 2 }
describe('US03 parâmetros locais explícitos', () => {
  it('emite todos os parâmetros e versão sem alterar os dados originais', async () => {
    const wrapper = mount(ReplenishmentPolicyEditor, { props: { productId: 'p1', storeId: 's1', policy, canEdit: true } })
    await wrapper.get('[name="packSize"]').setValue('12')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[{ ...policy, packSize: 12 }]])
    expect(policy.packSize).toBe(6)
  })
  it('rejeita ausência de parâmetros e quantidade inválida', async () => {
    const wrapper = mount(ReplenishmentPolicyEditor, { props: { productId: 'p1', storeId: 's1', canEdit: true } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('Preencha')
    await wrapper.setProps({ policy })
    await wrapper.get('[name="packSize"]').setValue('-1')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
  })
  it.each([['windowDays', '1.5'], ['leadDays', '0.5'], ['reviewDays', '3651'], ['packSize', '1.5']])('rejeita parâmetro incompatível com o contrato: %s', async (field, value) => {
    const wrapper = mount(ReplenishmentPolicyEditor, { props: { productId: 'p1', storeId: 's1', policy, canEdit: true } })
    await wrapper.get(`[name="${field}"]`).setValue(value)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('valores válidos')
  })
  it('bloqueia usuário de leitura e preserva edição ao receber erro', async () => {
    const wrapper = mount(ReplenishmentPolicyEditor, { props: { productId: 'p1', storeId: 's1', policy, canEdit: false } })
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    await wrapper.setProps({ canEdit: true })
    await wrapper.get('[name="leadDays"]').setValue('20')
    await wrapper.setProps({ error: 'Conflito de versão' })
    expect((wrapper.get('[name="leadDays"]').element as HTMLInputElement).value).toBe('20')
    expect(wrapper.get('[role="alert"]').text()).toContain('Conflito')
  })
})
