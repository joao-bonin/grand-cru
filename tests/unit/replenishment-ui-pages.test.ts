import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReplenishmentPage from '../../app/pages/replenishment.vue'
import PurchaseDraftsPage from '../../app/pages/purchase-drafts.vue'
import { recommendation } from '../fixtures/replenishment'
import type { PurchaseDraft } from '../../shared/types/replenishment'

const draft: PurchaseDraft = { id: 'd1', key: 'k1', author: 'ana', createdAt: '2026-10-16T12:00:00Z', snapshotId: 'snapshot-1', version: 1, state: 'draft', total: 240, items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', description: 'Vinho', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }] }
const component = (name: string, props: string[], emits: string[]) => defineComponent({ name, props, emits, template: '<div><slot /></div>' })
const stubs = {
  AppShell: component('AppShell', ['user', 'active'], ['logout']),
  NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
  ErpSyncStatus: component('ErpSyncStatus', ['status', 'snapshot', 'configured', 'canSync', 'pending', 'error'], ['sync']),
  ReplenishmentList: component('ReplenishmentList', ['items', 'canSelect', 'error'], ['retry', 'selection', 'policy']),
  ReplenishmentPolicyEditor: component('ReplenishmentPolicyEditor', ['policy', 'productId', 'storeId', 'canEdit', 'pending', 'error'], ['save']),
  PurchaseDraftEditor: component('PurchaseDraftEditor', ['draft', 'canEdit', 'pending', 'error'], ['save']),
  PurchaseDraftHistory: component('PurchaseDraftHistory', ['drafts', 'error'], ['open', 'retry']),
}
async function render(page: typeof ReplenishmentPage | typeof PurchaseDraftsPage) {
  const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(page) }) }), { global: { stubs } })
  await flushPromises()
  return wrapper
}
let role: 'admin' | 'user'; let query: Record<string, string>
const fetchMock = vi.fn(); const navigate = vi.fn(); const refresh = vi.fn()
const recommendations = ref({ items: [recommendation], snapshotId: 'snapshot-1', policies: [recommendation.policy], issues: [] as string[] })
const loadError = ref<Error | null>(null)
beforeEach(() => {
  role = 'admin'; query = {}; fetchMock.mockReset(); navigate.mockReset(); refresh.mockReset()
  recommendations.value = { items: [recommendation], snapshotId: 'snapshot-1', policies: [recommendation.policy], issues: [] }
  loadError.value = null
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useAuth', () => ({ user: ref({ login: 'ana', role }), logout: vi.fn() }))
  vi.stubGlobal('useRoute', () => ({ query }))
  vi.stubGlobal('navigateTo', navigate)
  vi.stubGlobal('$fetch', fetchMock)
  vi.stubGlobal('useRequestFetch', () => vi.fn().mockResolvedValue(recommendations.value))
  vi.stubGlobal('useFetch', (path: string) => path === '/api/replenishment'
    ? { data: recommendations, error: loadError, pending: ref(false), refresh }
    : path === '/api/purchase-drafts'
      ? { data: ref({ drafts: [draft] }), error: ref(null), refresh }
      : { data: ref({ status: { state: 'success' }, snapshot: { id: 'snapshot-1', createdAt: '2026-10-16T12:00:00Z' }, configured: true }), error: ref(null), refresh })
})
afterEach(() => vi.unstubAllGlobals())
describe('T26 página autenticada de reposição', () => {
  it('compõe status, parâmetros e seleção com snapshot, usando só a API local', async () => {
    const wrapper = await render(ReplenishmentPage)
    expect(vi.mocked(globalThis.definePageMeta)).toHaveBeenCalledWith({ middleware: ['auth'] })
    const list = wrapper.findComponent({ name: 'ReplenishmentList' })
    list.vm.$emit('selection', [{ productId: 'p1', storeId: 's1' }])
    list.vm.$emit('policy', recommendation)
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ReplenishmentPolicyEditor' }).props()).toMatchObject({ policy: recommendation.policy, productId: 'p1', storeId: 's1', canEdit: true })
    await wrapper.get('button').trigger('click')
    expect(navigate).toHaveBeenCalledWith({ path: '/purchase-drafts', query: { snapshot: 'snapshot-1', items: JSON.stringify([{ productId: 'p1', storeId: 's1' }]) } })
    wrapper.findComponent({ name: 'ErpSyncStatus' }).vm.$emit('sync')
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith('/api/erp/sync', { method: 'POST' })
    expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith('/api/'))).toBe(true)
  })
  it('mantém versão publicada ao falhar consulta e trata erro de sincronização', async () => {
    const wrapper = await render(ReplenishmentPage)
    loadError.value = new Error('Erro de consulta')
    recommendations.value = { items: [], snapshotId: '', policies: [], issues: [] }
    await flushPromises()
    const list = wrapper.findComponent({ name: 'ReplenishmentList' })
    expect(list.props('items')).toEqual([recommendation])
    expect(list.props('error')).toContain('Não foi possível')
    expect(list.props('error')).toContain('resultados anteriores foram mantidos')
    expect(list.props('canSelect')).toBe(false)
    list.vm.$emit('selection', [{ productId: 'p1', storeId: 's1' }])
    await flushPromises()
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('button').trigger('click')
    expect(navigate).not.toHaveBeenCalled()
    fetchMock.mockRejectedValueOnce(new Error('Timeout'))
    wrapper.findComponent({ name: 'ErpSyncStatus' }).vm.$emit('sync')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ErpSyncStatus' }).props('error')).toContain('versão anterior foi preservada')
  })
  it('envia política somente ao servidor local e preserva editor no conflito', async () => {
    const wrapper = await render(ReplenishmentPage)
    wrapper.findComponent({ name: 'ReplenishmentList' }).vm.$emit('policy', recommendation)
    await flushPromises()
    const policy = { ...recommendation.policy!, cost: 23 }
    fetchMock.mockRejectedValueOnce({ statusCode: 409 })
    wrapper.findComponent({ name: 'ReplenishmentPolicyEditor' }).vm.$emit('save', policy)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith('/api/replenishment/policies/p1', { method: 'PUT', body: policy })
    expect(wrapper.findComponent({ name: 'ReplenishmentPolicyEditor' }).props('error')).toContain('Confira a versão')
    fetchMock.mockResolvedValueOnce({ policy })
    wrapper.findComponent({ name: 'ReplenishmentPolicyEditor' }).vm.$emit('save', policy)
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ReplenishmentPolicyEditor' }).exists()).toBe(false)
  })
  it('impede ações de usuário consultor mesmo com evento forjado', async () => {
    role = 'user'
    const wrapper = await render(ReplenishmentPage)
    expect(wrapper.findComponent({ name: 'ReplenishmentList' }).props('canSelect')).toBe(false)
    wrapper.findComponent({ name: 'ErpSyncStatus' }).vm.$emit('sync')
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
describe('T35 página de rodadas e histórico', () => {
  it('abre rodada salva e preserva ajustes quando o servidor rejeita versão', async () => {
    const wrapper = await render(PurchaseDraftsPage)
    wrapper.findComponent({ name: 'PurchaseDraftHistory' }).vm.$emit('open', draft)
    await flushPromises()
    const editor = wrapper.findComponent({ name: 'PurchaseDraftEditor' })
    expect(editor.props('draft')).toEqual(draft)
    fetchMock.mockRejectedValueOnce({ statusCode: 409 })
    const command = { id: 'd1', key: 'k1', snapshotId: 'snapshot-1', version: 1, state: 'draft', items: [{ productId: 'p1', storeId: 's1', adjusted: 18, expectedPolicyVersion: 1 }] }
    editor.vm.$emit('save', command)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith('/api/purchase-drafts', { method: 'POST', body: command })
    expect(editor.props('draft')).toEqual(draft)
    expect(editor.props('error')).toContain('Conflito de versão')
  })
  it('salva retorno autoritativo e recupera histórico sem envio ERP', async () => {
    const wrapper = await render(PurchaseDraftsPage)
    wrapper.findComponent({ name: 'PurchaseDraftHistory' }).vm.$emit('open', draft)
    await flushPromises()
    const saved = { ...draft, version: 2, state: 'reviewed' as const }
    fetchMock.mockResolvedValueOnce({ draft: saved })
    wrapper.findComponent({ name: 'PurchaseDraftEditor' }).vm.$emit('save', { key: 'k1', snapshotId: 'snapshot-1', state: 'reviewed', items: [] })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'PurchaseDraftEditor' }).props('draft')).toEqual(saved)
    expect(wrapper.text()).toContain('Nenhum pedido foi enviado ao ERP')
    expect(refresh).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/purchase-drafts', { replace: true })
  })
  it.each(['null', '[null]', '[{}]', '[]'])('rejeita seleção inválida sem expor um editor: %s', async items => {
    query = { items, snapshot: 'snapshot-1' }
    const wrapper = await render(PurchaseDraftsPage)
    expect(wrapper.findComponent({ name: 'PurchaseDraftEditor' }).exists()).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toContain('Seleção inválida')
  })
  it('bloqueia seleção com recomendação indisponível e acesso de leitura', async () => {
    query = { items: JSON.stringify([{ productId: 'p1', storeId: 's1' }]), snapshot: 'snapshot-1' }
    recommendations.value.items = [{ ...recommendation, suggested: null }]
    const unavailable = await render(PurchaseDraftsPage)
    expect(unavailable.get('[role="alert"]').text()).toContain('Seleção indisponível')
    role = 'user'
    const readOnly = await render(PurchaseDraftsPage)
    expect(readOnly.findComponent({ name: 'PurchaseDraftEditor' }).exists()).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('cria rodada da seleção atual e bloqueia snapshot obsoleto', async () => {
    query = { items: JSON.stringify([{ productId: 'p1', storeId: 's1' }]), snapshot: 'snapshot-1' }
    const wrapper = await render(PurchaseDraftsPage)
    expect(wrapper.findComponent({ name: 'PurchaseDraftEditor' }).props('draft')).toMatchObject({ snapshotId: 'snapshot-1', state: 'draft', items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }] })
    query.snapshot = 'older'
    const stale = await render(PurchaseDraftsPage)
    expect(stale.findComponent({ name: 'PurchaseDraftEditor' }).exists()).toBe(false)
    expect(stale.get('[role="alert"]').text()).toContain('Os dados mudaram')
  })
})
