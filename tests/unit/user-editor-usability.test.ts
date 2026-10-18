import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UserEditor from '../../app/components/UserEditor.vue'
import { ref } from 'vue'
vi.stubGlobal('ref', ref)
const user = { id: 'synthetic', login: 'ana', role: 'user' as const, active: true, createdAt: '', updatedAt: '', lastAccessAt: null }
const options = { props: { pending: false, error: '' }, global: { stubs: {
  UFormField: { props: ['label', 'help'], template: '<div><label>{{ label }}<slot /></label><p>{{ help }}</p></div>' },
  UInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">' },
  USelect: { props: ['modelValue'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="user">Usuário</option><option value="admin">Administrador</option></select>' },
  UCheckbox: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue">' },
  UButton: { template: '<button><slot /></button>' },
  UAlert: { props: ['title'], template: '<p role="alert">{{ title }}</p>' },
} } }
describe('clareza do formulário de usuários', () => {
  it('agrupa identificação e permissões com ajuda de senha e perfil', async () => {
    const wrapper = mount(UserEditor, options)
    expect(wrapper.findAll('legend').map(legend => legend.text())).toEqual(['Identificação e segurança', 'Permissões e acesso'])
    expect(wrapper.text()).toContain('Use pelo menos 12 caracteres')
    expect(wrapper.text()).toContain('Consulta as informações, sem gerenciar usuários ou parâmetros.')
    await wrapper.get('select').setValue('admin')
    expect(wrapper.text()).toContain('Gerencia usuários e configura parâmetros locais do Grand Cru.')
    expect(wrapper.text()).toContain('Contas inativas não podem entrar no aplicativo.')
  })
  it('preserva as regras de cadastro e senha opcional na edição', () => {
    const create = mount(UserEditor, options)
    expect(create.get('[name="login"]').attributes()).toMatchObject({ minlength: '3', maxlength: '100', required: '' })
    expect(create.get('[name="password"]').attributes()).toMatchObject({ minlength: '12', maxlength: '128', autocomplete: 'new-password', required: '' })
    const edit = mount(UserEditor, { ...options, props: { ...options.props, user } })
    expect(edit.get('[name="password"]').attributes('required')).toBeUndefined()
    expect(edit.text()).toContain('Deixe em branco para manter a senha atual.')
  })
  it('impede submissão duplicada e cancelamento enquanto salva', async () => {
    const wrapper = mount(UserEditor, { ...options, props: { pending: true, error: '' } })
    for (const field of wrapper.findAll('input, select, button')) expect(field.attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})
