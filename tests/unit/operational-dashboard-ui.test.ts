import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OperationalDashboard from '../../app/components/OperationalDashboard.vue'
import DashboardTeam from '../../app/components/DashboardTeam.vue'
import { buildOperationalDashboard } from '../../shared/application/operational-dashboard'
import { dashboardExample, dashboardSnapshot } from '../fixtures/dashboard'
import { recommendation } from '../fixtures/replenishment'
import { sampleUsers, uiStubs } from '../fixtures/users'

const global = { stubs: uiStubs }

describe('Dashboard operacional para o comprador', () => {
  it('destaca compra, conferência, risco e revisões e oferece caminhos funcionais', () => {
    const wrapper = mount(OperationalDashboard, { props: { dashboard: dashboardExample() }, global })
    expect(wrapper.findAll('.operation-metric strong').map(node => node.text())).toEqual(['1', '0', '1', '1'])
    expect(wrapper.findAll('a').map(node => node.attributes('href'))).toContain('/replenishment')
    expect(wrapper.findAll('a').map(node => node.attributes('href'))).toContain('/purchase-drafts')
    expect(wrapper.text()).toContain('Fornecedor exemplo')
    expect(wrapper.get('.operation-risk').text()).toBe('Ruptura prevista: 01 de nov. de 2026')
    expect(wrapper.text()).toContain('Nenhum pedido é enviado')
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Tempo médio')
  })
  it('não mostra zero nem ausência de risco quando os dados ainda não foram sincronizados', () => {
    const wrapper = mount(OperationalDashboard, { props: { dashboard: buildOperationalDashboard(null, [], [], 'idle') }, global })
    expect(wrapper.findAll('.operation-metric strong').map(node => node.text())).toEqual(['—', '—', '—', '0'])
    expect(wrapper.text()).toContain('Comece pelos dados da operação')
    expect(wrapper.text()).toContain('Risco ainda não calculado')
  })
  it('explica que bloqueios não provam estoque suficiente quando não há sugestões prontas', () => {
    const dashboard = buildOperationalDashboard(dashboardSnapshot, [{ ...recommendation, suggested: null, dailyDemand: null, ruptureDate: null, issues: ['SALES_HISTORY_COVERAGE_UNCONFIRMED'] }], [], 'success')
    const wrapper = mount(OperationalDashboard, { props: { dashboard }, global })
    expect(wrapper.get('.operation-empty h3').text()).toBe('Há dados para conferir')
    expect(wrapper.get('.operation-empty').text()).toContain('não significa que o estoque está suficiente')
    expect(wrapper.get('[data-metric="rupture"] small').text()).toBe('1 com risco ainda não calculado')
    expect(wrapper.text()).not.toContain('SALES_HISTORY_COVERAGE_UNCONFIRMED')
  })
  it('distingue erro de sincronização e versão anterior de falha de leitura do próprio dashboard', async () => {
    const dashboard = { ...dashboardExample(), synchronization: 'failed' as const }
    const wrapper = mount(OperationalDashboard, { props: { dashboard }, global })
    expect(wrapper.get('[role="status"]').text()).toContain('última versão disponível')
    await wrapper.setProps({ error: 'Tente novamente.' })
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar o dashboard')
    expect(wrapper.find('.operation-metrics').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
  it('oferece atualização explícita do resumo e estado de carregamento sem números provisórios', async () => {
    const wrapper = mount(OperationalDashboard, { props: { dashboard: dashboardExample() }, global })
    await wrapper.get('.operation-source button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    await wrapper.setProps({ pending: true })
    expect(wrapper.get('section').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[role="status"]').text()).toContain('Carregando')
    expect(wrapper.find('.operation-metrics').exists()).toBe(false)
  })
})

describe('Equipe integrada ao dashboard', () => {
  it('mantém gestão e criação acessíveis com métricas reais da equipe', () => {
    const wrapper = mount(DashboardTeam, { props: { users: sampleUsers }, global })
    expect(wrapper.text()).toContain('2 acessos ativos · 3 usuários cadastrados')
    expect(wrapper.get('a[href="/users"]').text()).toBe('Gerenciar usuários')
    expect(wrapper.get('a[href="/users?novo=1"]').text()).toBe('Novo usuário')
  })
  it('não mostra equipe vazia como real quando sua consulta falha e permite repetir', async () => {
    const wrapper = mount(DashboardTeam, { props: { users: [], error: 'Não foi possível consultar os acessos.' }, global })
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível')
    expect(wrapper.text()).not.toContain('0 acessos ativos')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
