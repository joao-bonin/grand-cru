import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminOverview from '../../app/components/AdminOverview.vue'
import AppShell from '../../app/components/AppShell.vue'
import UserMetrics from '../../app/components/UserMetrics.vue'
import UserDirectory from '../../app/components/UserDirectory.vue'
import { sampleUsers, uiStubs } from '../fixtures/users'

describe('Painel administrativo', () => {
  const options = { props: { users: sampleUsers }, global: { components: { UserMetrics, UserDirectory }, stubs: uiStubs } }
  it('apresenta contadores a partir dos usuários recebidos e um único título principal', () => {
    const wrapper = mount(AdminOverview, options)
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findAll('.metric-card strong').map(item => item.text())).toEqual(['3', '2', '1', '1'])
  })
  it('encaminha criação e gestão de usuários para rotas funcionais', () => {
    const wrapper = mount(AdminOverview, options)
    expect(wrapper.findAll('a').map(item => item.attributes('href'))).toContain('/users?novo=1')
    expect(wrapper.findAll('a').find(item => item.text().includes('Gerenciar usuários'))?.attributes('href')).toBe('/users')
  })
  it('ordena os cadastros recentes sem alterar a coleção de origem', () => {
    const wrapper = mount(AdminOverview, options)
    expect(wrapper.findAll('.directory-person h3').map(item => item.text())).toEqual(['financeiro', 'comercial', 'ana'])
    expect(sampleUsers[0]?.login).toBe('ana')
  })
})

describe('Navegação e acesso', () => {
  const options = { props: { user: sampleUsers[0]!, active: 'overview' as const }, global: { stubs: uiStubs } }
  it('oferece administração somente no menu do administrador', () => {
    expect(mount(AppShell, options).find('a[href="/users"]').exists()).toBe(true)
    const member = mount(AppShell, { ...options, props: { ...options.props, user: sampleUsers[1]! } })
    expect(member.find('a[href="/users"]').exists()).toBe(false)
  })
  it('identifica a rota ativa para tecnologias assistivas', () => {
    const wrapper = mount(AppShell, options)
    expect(wrapper.get('nav a[href="/"]').attributes('aria-current')).toBe('page')
  })
  it('encaminha a saída da sessão', async () => {
    const wrapper = mount(AppShell, options)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })
})
