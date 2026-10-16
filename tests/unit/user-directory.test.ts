import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UserDirectory from '../../app/components/UserDirectory.vue'
import { filterUserDirectory, formatAccessDate, userDirectorySummary } from '../../shared/application/user-directory'
import { sampleUsers, uiStubs } from '../fixtures/users'

describe('Consulta de usuários', () => {
  it('conta usuários, status e somente administradores ativos', () => {
    expect(userDirectorySummary([...sampleUsers, { ...sampleUsers[0]!, id: 'inactive-admin', active: false }])).toEqual({ total: 4, active: 2, inactive: 2, administrators: 1 })
  })
  it('retorna contadores zerados quando não há usuários', () => {
    expect(userDirectorySummary([])).toEqual({ total: 0, active: 0, inactive: 0, administrators: 0 })
  })
  it('normaliza busca e combina filtros de status e perfil', () => {
    expect(filterUserDirectory(sampleUsers, ' COMER ', 'active', 'user').map(user => user.id)).toEqual(['member'])
    expect(filterUserDirectory(sampleUsers, '', 'inactive', 'admin')).toEqual([])
    expect(filterUserDirectory(sampleUsers, '', 'inactive').map(user => user.id)).toEqual(['inactive'])
  })
  it('busca sem resultado não altera os dados originais', () => {
    expect(filterUserDirectory(sampleUsers, 'não-existe')).toEqual([])
    expect(sampleUsers).toHaveLength(3)
  })
  it('formata o acesso no fuso definido e informa quem nunca acessou', () => {
    expect(formatAccessDate(null)).toBe('Ainda não acessou')
    expect(formatAccessDate('2026-01-01T00:00:00Z')).toContain('31/12/2025')
  })
})

describe('Lista de usuários', () => {
  const options = { props: { users: sampleUsers, actions: true }, global: { stubs: uiStubs } }
  it('apresenta login, perfil, status e datas do cadastro', () => {
    const wrapper = mount(UserDirectory, options)
    expect(wrapper.findAll('article')).toHaveLength(3)
    expect(wrapper.text()).toContain('comercial')
    expect(wrapper.text()).toContain('Administrador')
    expect(wrapper.text()).toContain('Inativo')
    expect(wrapper.text()).toContain('Atualizado em')
    expect(wrapper.text()).toContain('Ainda não acessou')
  })
  it.each([['Editar', 'edit'], ['Inativar', 'toggle'], ['Excluir', 'remove']])('encaminha %s para o usuário correto', async (label, event) => {
    const wrapper = mount(UserDirectory, options)
    const button = wrapper.findAll('button').find(item => item.text() === label)!
    await button.trigger('click')
    expect(wrapper.emitted(event)).toEqual([[sampleUsers[0]]])
  })
  it('bloqueia ações enquanto uma alteração está em andamento', () => {
    const wrapper = mount(UserDirectory, { ...options, props: { ...options.props, pending: true } })
    expect(wrapper.findAll('button').every(button => button.attributes('disabled') !== undefined)).toBe(true)
  })
  it('mostra estado vazio e não oferece ações sobre usuários ausentes', () => {
    const wrapper = mount(UserDirectory, { ...options, props: { users: [], actions: true } })
    expect(wrapper.text()).toContain('Nenhum usuário encontrado')
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
