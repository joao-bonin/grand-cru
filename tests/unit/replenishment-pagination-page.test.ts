import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import type { ComputedRef } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReplenishmentPage from '../../app/pages/replenishment.vue'
import { recommendation } from '../fixtures/replenishment'
const response = ref({ items: [recommendation], snapshotId: 'snapshot-1', policies: [], issues: [], start: 0, count: 20, total: 43, supplierIds: ['f1'] })
const loading = ref(false)
let requestQuery: ComputedRef<Record<string, unknown>>
const stub = defineComponent({ name: 'ReplenishmentList', props: ['items', 'pagination', 'loading'], emits: ['page', 'filters', 'selection'], template: '<div />' })
beforeEach(() => {
  response.value = { items: [recommendation], snapshotId: 'snapshot-1', policies: [], issues: [], start: 0, count: 20, total: 43, supplierIds: ['f1'] }
  loading.value = false
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useAuth', () => ({ user: ref({ role: 'admin' }), logout: vi.fn() }))
  vi.stubGlobal('useFetch', (url: string, options?: { query: ComputedRef<Record<string, unknown>> }) => {
    if (url === '/api/replenishment') { requestQuery = options!.query; return { data: response, pending: loading, error: ref(null), refresh: vi.fn() } }
    return { data: ref(null), error: ref(null), refresh: vi.fn() }
  })
})
afterEach(() => vi.unstubAllGlobals())
async function render() {
  const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(ReplenishmentPage) }) }), { global: { stubs: { AppShell: { template: '<div><slot /></div>' }, NuxtLink: { template: '<a><slot /></a>' }, ErpSyncStatus: true, ReplenishmentList: stub } } })
  await flushPromises(); return wrapper
}
describe('requisições paginadas da página', () => {
  it('solicita20 itens e reinicia filtros sem seleção invisível', async () => {
    const wrapper = await render()
    expect(requestQuery.value).toMatchObject({ start: 0, count: 20 })
    const list = wrapper.findComponent(stub)
    list.vm.$emit('selection', [{ productId: 'p1', storeId: 's1' }]); await flushPromises()
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    list.vm.$emit('page', 20); await flushPromises()
    expect(requestQuery.value).toMatchObject({ start: 20, count: 20 })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    list.vm.$emit('filters', { product: 'sku42', supplier: 'f2', risk: true, issues: false }); await flushPromises()
    expect(requestQuery.value).toEqual({ start: 0, count: 20, product: 'sku42', supplier: 'f2', risk: 'true', issues: undefined })
  })
  it('recupera primeira página quando o conjunto encolhe e bloqueia revisão durante carga', async () => {
    const wrapper = await render(); const list = wrapper.findComponent(stub)
    list.vm.$emit('page', 40); await flushPromises()
    response.value = { ...response.value, start: 40, total: 0, items: [] }; await flushPromises()
    expect(requestQuery.value).toMatchObject({ start: 0, count: 20 })
    list.vm.$emit('selection', [{ productId: 'p1', storeId: 's1' }]); loading.value = true; await flushPromises()
    expect(list.props('loading')).toBe(true)
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
