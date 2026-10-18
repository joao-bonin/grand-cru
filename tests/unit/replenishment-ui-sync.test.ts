import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErpSyncStatus from '../../app/components/ErpSyncStatus.vue'
import type { SyncStatus } from '../../shared/types/replenishment'
const status: SyncStatus = { id: 'run', state: 'failed', startedAt: null, finishedAt: null, error: 'Autenticação pendente', snapshotId: 'v1' }
describe('US02 estado da sincronização', () => {
  it('preserva versão anterior, exibe falha e pede atualização local', async () => {
    const wrapper = mount(ErpSyncStatus, { props: { status, snapshot: { id: 'v1', createdAt: '2026-10-16T12:00:00Z' }, configured: true, canSync: true } })
    expect(wrapper.text()).toContain('v1')
    expect(wrapper.get('[role="alert"]').text()).toContain('Autenticação pendente')
    expect(wrapper.text()).toContain('somente leitura')
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').element.closest('details')).toBeNull()
    expect(wrapper.get('[role="status"]').text()).toContain('Falha na atualização')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('sync')).toEqual([[]])
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
