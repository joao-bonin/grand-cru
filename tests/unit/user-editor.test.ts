import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UserEditor from '../../app/components/UserEditor.vue'
import type { PublicUser } from '../../shared/types/user'

vi.stubGlobal('ref', ref)
const options = {
  props: { pending: false, error: '' },
  global: { stubs: {
    UFormField: { template: '<div><slot /></div>' },
    UInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">' },
    USelect: { props: ['modelValue'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="user">Usuário</option><option value="admin">Administrador</option></select>' },
    UCheckbox: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)">' },
    UButton: { template: '<button><slot /></button>' },
    UAlert: { props: ['title'], template: '<p role="alert">{{ title }}</p>' },
  } },
}
const user: PublicUser = { id: 'existing', login: 'existing-user', active: true, role: 'user', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastAccessAt: null }
describe('Editor de usuários', () => {
  it('envia o cadastro com senha e perfil selecionado', async () => {
    const wrapper = mount(UserEditor, options)
    const inputs = wrapper.findAll('input:not([type="checkbox"])')
    await inputs[0]!.setValue('new-user')
    await inputs[1]!.setValue('long-password-123')
    await wrapper.get('select').setValue('admin')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[{ login: 'new-user', password: 'long-password-123', role: 'admin', active: true }]])
  })
  it('permite inativar a conta sem enviar uma senha vazia', async () => {
    const wrapper = mount(UserEditor, { ...options, props: { ...options.props, user } })
    await wrapper.get('input[type="checkbox"]').setValue(false)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[{ login: 'existing-user', role: 'user', active: false }]])
  })
  it('oferece cancelamento sem salvar alterações', async () => {
    const wrapper = mount(UserEditor, options)
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('save')).toBeUndefined()
  })
  it('exibe erros e desabilita edição durante o salvamento', () => {
    const wrapper = mount(UserEditor, { ...options, props: { pending: true, error: 'Login em uso.' } })
    expect(wrapper.get('[role="alert"]').text()).toBe('Login em uso.')
    for (const input of wrapper.findAll('input')) expect(input.attributes('disabled')).toBeDefined()
  })
})
