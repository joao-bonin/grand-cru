import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '../../app/pages/index.vue'
import { dashboardExample } from '../fixtures/dashboard'
import { sampleUsers, uiStubs } from '../fixtures/users'

const refreshDashboard = vi.fn()
const refreshTeam = vi.fn()
const logout = vi.fn()
let role: 'admin' | 'user'
const teamError = ref<Error | null>(null)
const dashboardError = ref<Error | null>(null)
const component = (name: string, props: string[], emits: string[] = []) => defineComponent({ name, props, emits, template: '<div><slot /></div>' })
const stubs = {
  ...uiStubs,
  AppShell: component('AppShell', ['user', 'active'], ['logout']),
  OperationalDashboard: component('OperationalDashboard', ['dashboard', 'pending', 'error'], ['retry']),
  DashboardTeam: component('DashboardTeam', ['users', 'pending', 'error'], ['retry']),
}
const fetch = vi.fn((path: string) => path === '/api/dashboard'
  ? { data: ref(dashboardExample()), error: dashboardError, pending: ref(false), refresh: refreshDashboard }
  : { data: ref({ users: sampleUsers }), error: teamError, pending: ref(false), refresh: refreshTeam })
async function render() {
  const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(DashboardPage) }) }), { global: { stubs } })
  await flushPromises()
  return wrapper
}
beforeEach(() => {
  role = 'admin'; teamError.value = null; dashboardError.value = null
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useAuth', () => ({ user: ref({ ...sampleUsers[0], role }), logout }))
  vi.stubGlobal('useFetch', fetch)
})
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals() })

describe('Página inicial do dashboard autenticado', () => {
  it('entrega o resumo operacional e a gestão da equipe ao administrador com um único título principal', async () => {
    const wrapper = await render()
    expect(vi.mocked(globalThis.definePageMeta)).toHaveBeenCalledWith({ middleware: ['auth'] })
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'OperationalDashboard' }).props('dashboard')).toMatchObject({ products: { ready: 1 } })
    expect(wrapper.findComponent({ name: 'DashboardTeam' }).props('users')).toEqual(sampleUsers)
    expect(fetch).toHaveBeenCalledWith('/api/users', { immediate: true })
    wrapper.findComponent({ name: 'OperationalDashboard' }).vm.$emit('retry')
    wrapper.findComponent({ name: 'DashboardTeam' }).vm.$emit('retry')
    wrapper.findComponent({ name: 'AppShell' }).vm.$emit('logout')
    expect(refreshDashboard).toHaveBeenCalledOnce()
    expect(refreshTeam).toHaveBeenCalledOnce()
    expect(logout).toHaveBeenCalledOnce()
  })
  it('mantém resumo para consultores sem exibir equipe nem disparar sua consulta', async () => {
    role = 'user'
    const wrapper = await render()
    expect(wrapper.findComponent({ name: 'OperationalDashboard' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'DashboardTeam' }).exists()).toBe(false)
    expect(fetch).toHaveBeenCalledWith('/api/users', { immediate: false })
  })
  it('isola indisponibilidade da equipe do resumo de compras e não expõe erros técnicos', async () => {
    teamError.value = new Error('synthetic secret internals')
    const wrapper = await render()
    expect(wrapper.findComponent({ name: 'DashboardTeam' }).props('error')).toBe('Não foi possível consultar os acessos da equipe.')
    expect(wrapper.findComponent({ name: 'OperationalDashboard' }).props('error')).toBe('')
    expect(wrapper.text()).not.toContain('synthetic secret internals')
  })
})
