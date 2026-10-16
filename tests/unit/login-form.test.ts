import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoginForm from '../../app/components/LoginForm.vue'

vi.stubGlobal('ref', ref)
const options = {
  props: { pending: false, error: '' },
  global: { stubs: {
    UFormField: { template: '<div><slot name="hint" /><slot /></div>' },
    UInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">' },
    UButton: { template: '<button><slot /></button>' },
    UAlert: { props: ['title'], template: '<p role="alert">{{ title }}</p>' },
  } },
}
describe('Formulário de login', () => {
  it('envia login e senha digitados', async () => {
    const wrapper = mount(LoginForm, options)
    await wrapper.get('#login').setValue('joao')
    await wrapper.get('#password').setValue('typed-password')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['joao', 'typed-password']])
  })
  it('oculta a senha por padrão e permite alternar sua visibilidade', async () => {
    const wrapper = mount(LoginForm, options)
    expect(wrapper.get('#password').attributes('type')).toBe('password')
    await wrapper.get('.password-toggle').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('text')
    expect(wrapper.get('.password-toggle').attributes('aria-pressed')).toBe('true')
  })
  it('desabilita os controles enquanto o login está em andamento', () => {
    const wrapper = mount(LoginForm, { ...options, props: { pending: true, error: '' } })
    expect(wrapper.get('#login').attributes('disabled')).toBeDefined()
    expect(wrapper.get('#password').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.login-submit').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.login-submit').text()).toContain('Entrando')
  })
  it('apresenta a falha de autenticação em uma região de alerta', () => {
    const wrapper = mount(LoginForm, { ...options, props: { pending: false, error: 'Login ou senha inválidos.' } })
    expect(wrapper.get('[role="alert"]').text()).toBe('Login ou senha inválidos.')
  })
})
