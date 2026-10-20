import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../../app/pages/index.vue'
import LoginPage from '../../app/pages/login.vue'

const login = vi.fn()
const navigate = vi.fn()
const LoginForm = defineComponent({
  name: 'LoginForm', props: ['pending', 'error'], emits: ['submit'], template: '<form />',
})
beforeEach(() => {
  login.mockReset(); navigate.mockReset()
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useAuth', () => ({ login }))
  vi.stubGlobal('navigateTo', navigate)
})
afterEach(() => vi.unstubAllGlobals())

describe('Dashboard como página inicial', () => {
  it('encaminha a raiz protegida para o dashboard substituindo a entrada no histórico', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('useFetch', fetch)
    const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(HomePage) }) }))
    await flushPromises()
    expect(globalThis.definePageMeta).toHaveBeenCalledWith({ middleware: ['auth'] })
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    expect(fetch).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('abre o dashboard somente após o login bem-sucedido', async () => {
    const wrapper = mount(LoginPage, { global: { stubs: { LoginForm } } })
    const form = wrapper.getComponent(LoginForm)
    login.mockRejectedValueOnce({ statusCode: 401 })
    form.vm.$emit('submit', 'consulta', 'senha-incorreta')
    await flushPromises()
    expect(navigate).not.toHaveBeenCalled()
    expect(form.props('error')).toBe('Login ou senha inválidos.')
    login.mockResolvedValueOnce(undefined)
    form.vm.$emit('submit', 'consulta', 'senha-sintetica')
    await flushPromises()
    expect(login).toHaveBeenLastCalledWith('consulta', 'senha-sintetica')
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/dashboard')
    expect(form.props('error')).toBe('')
    expect(form.props('pending')).toBe(false)
    wrapper.unmount()
  })
})
