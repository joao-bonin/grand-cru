import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErpSyncStatus from '../../app/components/ErpSyncStatus.vue'
import type { SyncStatus } from '../../shared/types/replenishment'
const status: SyncStatus = { id: 'run', state: 'failed', startedAt: null, finishedAt: null, error: 'Autenticação pendente', snapshotId: 'v1' }
const resumable: SyncStatus = {
  ...status,
  error: 'Não foi possível consultar as vendas.',
  progress: { completed: ['catalog', 'stock'], current: 'sales', resumable: true },
}
describe('US02 estado da sincronização', () => {
  it('preserva versão anterior, exibe falha e pede atualização local', async () => {
    const wrapper = mount(ErpSyncStatus, { props: { status, snapshot: { id: 'v1', createdAt: '2026-10-16T12:00:00Z' }, configured: true, canSync: true } })
    expect(wrapper.text()).toContain('v1')
    expect(wrapper.get('[role="alert"]').text()).toContain('Autenticação pendente')
    expect(wrapper.text()).toContain('somente leitura')
    expect(wrapper.get('button').text()).toBe('Atualizar agora')
    expect(wrapper.find('[aria-label="Progresso da atualização"]').exists()).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('sync')).toEqual([[]])
  })
  it('oferece retomada com os dados concluídos e mantém a versão publicada', async () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: resumable, snapshot: { id: 'v1', createdAt: '2026-10-16T12:00:00Z' }, configured: true, canSync: true } })
    expect(wrapper.text()).toContain('Versão v1')
    expect(wrapper.text()).toContain('A última versão publicada permanece válida')
    expect(wrapper.get('[aria-label="Progresso da atualização"]').findAll('li').map(item => item.text())).toEqual([
      'Catálogo: Concluído',
      'Estoque: Concluído',
      'Vendas: Pendente',
      'Compras pendentes: Pendente',
    ])
    expect(wrapper.get('button').text()).toBe('Retomar atualização')
    expect(wrapper.text()).not.toContain('checkpoint')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('sync')).toEqual([[]])
  })
  it('permite retomar a primeira carga sem afirmar que existe versão publicada', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: { ...resumable, snapshotId: null }, configured: true, canSync: true } })
    expect(wrapper.text()).toContain('Nenhuma versão publicada')
    expect(wrapper.text()).not.toContain('A última versão publicada permanece válida')
    expect(wrapper.get('button').text()).toBe('Retomar atualização')
  })
  it('bloqueia retomada durante uma solicitação ou execução e sem configuração', async () => {
    for (const props of [
      { status: resumable, configured: true, canSync: true, pending: true },
      { status: { ...resumable, state: 'running' as const }, configured: true, canSync: true },
      { status: resumable, configured: false, canSync: true },
    ]) {
      const wrapper = mount(ErpSyncStatus, { props })
      expect(wrapper.get('button').attributes('disabled')).toBeDefined()
      await wrapper.get('button').trigger('click')
      expect(wrapper.emitted('sync')).toBeUndefined()
    }
  })
  it('oculta a retomada sem permissão de atualização', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: resumable, configured: true, canSync: false } })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('[aria-label="Progresso da atualização"]').text()).toContain('Estoque: Concluído')
  })
  it('distingue a consulta em andamento das etapas pendentes', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: { ...resumable, state: 'running', error: null }, configured: true, canSync: true } })
    expect(wrapper.get('[aria-label="Progresso da atualização"]').text()).toContain('Vendas: Em consulta')
    expect(wrapper.get('[aria-label="Progresso da atualização"]').text()).toContain('Compras pendentes: Pendente')
    expect(wrapper.get('button').text()).toBe('Atualizando…')
  })
  it('não oferece retomada quando não há dados recuperáveis', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: { ...resumable, progress: { completed: [], current: null, resumable: false } }, configured: true, canSync: true } })
    expect(wrapper.get('button').text()).toBe('Atualizar agora')
    expect(wrapper.get('[aria-label="Progresso da atualização"]').findAll('li').every(item => item.text().endsWith('Pendente'))).toBe(true)
  })
  it('remove a oferta de retomada após sucesso mesmo com indicador anterior de recuperação', async () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: resumable, configured: true, canSync: true } })
    await wrapper.setProps({ status: { ...resumable, state: 'success', error: null, progress: { completed: [], current: null, resumable: true } } })
    expect(wrapper.text()).toContain('Atualização concluída')
    expect(wrapper.text()).not.toContain('Retomar atualização')
    expect(wrapper.get('button').text()).toBe('Atualizar agora')
    expect(wrapper.get('[aria-label="Progresso da atualização"]').findAll('li').map(item => item.text())).toEqual([
      'Catálogo: Concluído',
      'Estoque: Concluído',
      'Vendas: Concluído',
      'Compras pendentes: Concluído',
    ])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('mantém autenticação pendente sem prometer retomada com token inválido', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: { ...resumable, error: 'ERP_AUTHENTICATION_PENDING' }, configured: true, canSync: true } })
    expect(wrapper.get('[role="alert"]').text()).toBe('Autenticação do ERP pendente. Configure um token de leitura válido no servidor.')
    expect(wrapper.get('button').text()).toBe('Atualizar agora')
    expect(wrapper.text()).not.toContain('A atualização pode continuar')
    expect(wrapper.text()).not.toContain('ERP_AUTHENTICATION_PENDING')
  })
  it('bloqueia atualização concorrente e acesso sem permissão/configuração', () => {
    for (const props of [{ status: { ...status, state: 'running' as const }, canSync: true, configured: true }, { status, canSync: false, configured: true }, { status, canSync: true, configured: false }]) {
      const wrapper = mount(ErpSyncStatus, { props })
      expect(wrapper.find('button').exists() ? wrapper.get('button').attributes('disabled') : 'disabled').toBeDefined()
    }
  })
  it('explica autenticação pendente sem exibir o código interno', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: { ...status, error: 'ERP_AUTHENTICATION_PENDING' } } })
    expect(wrapper.get('[role="alert"]').text()).toBe('Autenticação do ERP pendente. Configure um token de leitura válido no servidor.')
    expect(wrapper.text()).not.toContain('ERP_AUTHENTICATION_PENDING')
  })
  it('distingue ausência de carga e erro na consulta de estado', () => {
    const wrapper = mount(ErpSyncStatus, { props: { status: null, configured: false, error: 'Falha ao carregar estado' } })
    expect(wrapper.text()).toContain('Nenhuma versão publicada')
    expect(wrapper.get('[role="alert"]').text()).toContain('Falha ao carregar estado')
  })
})
