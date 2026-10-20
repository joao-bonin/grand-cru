import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BusinessDashboard from '../../app/components/BusinessDashboard.vue'
import DashboardPage from '../../app/pages/dashboard.vue'
import AppShell from '../../app/components/AppShell.vue'
import { buildBusinessDashboard } from '../../server/domain/dashboard/build-dashboard'
import { dashboardPolicy, dashboardSnapshot } from '../fixtures/dashboard'
import { sampleUsers, uiStubs } from '../fixtures/users'

const global = { stubs: uiStubs }
afterEach(() => vi.unstubAllGlobals())
describe('Dashboard visível e explicável', () => {
  it('explica a ausência de dados sem criar indicadores zerados', () => {
    const wrapper = mount(BusinessDashboard, { props: { report: buildBusinessDashboard(null, []) }, global })
    expect(wrapper.text()).toContain('Aguardando a primeira atualização')
    expect(wrapper.find('.business-metrics').exists()).toBe(false)
    expect(wrapper.get('a[href="/replenishment"]').exists()).toBe(true)
  })
  it('mostra cobertura dos indicadores, lojas, histórico parcial e filtros', async () => {
    const snapshot = dashboardSnapshot()
    snapshot.data.historyFrom = '2026-08-01'
    snapshot.data.products.push({ ...snapshot.data.products[0]!, storeId: 'store-b' })
    const wrapper = mount(BusinessDashboard, { props: { report: buildBusinessDashboard(snapshot, [dashboardPolicy]) }, global })
    expect(wrapper.text()).toContain('1 produto avaliado · 1 sem cálculo')
    expect(wrapper.text()).toContain('Histórico parcial')
    expect(wrapper.text()).toContain('Não avaliada')
    expect(wrapper.findAll('.business-product')).toHaveLength(2)
    await wrapper.get('select').setValue('store-b')
    expect(wrapper.findAll('.business-product')).toHaveLength(1)
    expect(wrapper.get('.business-product').text()).toContain('Loja store-b')
    await wrapper.get('input[type="search"]').setValue('inexistente')
    expect(wrapper.text()).toContain('Nenhum produto corresponde aos filtros')
  })
  it('apresenta indisponibilidade em vez de zero para indicadores sem nenhum cálculo', () => {
    const wrapper = mount(BusinessDashboard, { props: { report: buildBusinessDashboard(dashboardSnapshot(), []) }, global })
    expect(wrapper.findAll('.business-metric strong').map(item => item.text())).toEqual(['1', 'Indisponível', 'Indisponível', '1'])
  })
  it.each(sampleUsers.slice(0, 2))('oferece Dashboard no menu para $role', (user) => {
    const wrapper = mount(AppShell, { props: { user, active: 'dashboard' }, global })
    expect(wrapper.get('a[href="/dashboard"]').attributes('aria-current')).toBe('page')
  })
  it('protege a página e oferece nova tentativa após falha', async () => {
    const refresh = vi.fn()
    const error = ref<Error | null>(new Error('Falha'))
    const data = ref(buildBusinessDashboard(null, []))
    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAuth', () => ({ user: ref(sampleUsers[0]), logout: vi.fn() }))
    vi.stubGlobal('useFetch', vi.fn(() => ({ data, error, status: ref('error'), refresh })))
    const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(DashboardPage) }) }), {
      global: { stubs: { ...uiStubs, AppShell: { template: '<main><slot /></main>' }, BusinessDashboard } },
    })
    await flushPromises()
    expect(globalThis.definePageMeta).toHaveBeenCalledWith({ middleware: ['auth'] })
    expect(globalThis.useFetch).toHaveBeenCalledWith('/api/dashboard')
    await wrapper.get('button').trigger('click')
    expect(refresh).toHaveBeenCalledOnce()
    error.value = null
    await flushPromises()
    expect(wrapper.text()).toContain('Aguardando a primeira atualização')
  })
})
