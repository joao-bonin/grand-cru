import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref, Suspense } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PurchaseDraftsPage from '../../app/pages/purchase-drafts.vue'

const status = ref('pending')
const data = ref<{ drafts: unknown[] } | null>(null)
const error = ref<Error | null>(null)
const refresh = vi.fn()
const stubs = {
  AppShell: { template: '<div><slot /></div>' },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  PurchaseDraftEditor: { template: '<div />' },
  PurchaseDraftHistory: defineComponent({ name: 'PurchaseDraftHistory', props: ['drafts', 'error'], emits: ['retry'], template: '<div />' }),
}
async function render() {
  const wrapper = mount(defineComponent({ render: () => h(Suspense, null, { default: () => h(PurchaseDraftsPage) }) }), { global: { stubs } })
  await flushPromises()
  return wrapper
}
beforeEach(() => {
  status.value = 'pending'; data.value = null; error.value = null; refresh.mockReset()
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useAuth', () => ({ user: ref({ login: 'demo', role: 'admin' }), logout: vi.fn() }))
  vi.stubGlobal('useRoute', () => ({ query: {} }))
  vi.stubGlobal('useFetch', () => ({ status, data, error, refresh }))
})
afterEach(() => vi.unstubAllGlobals())

describe('Navegação para rodadas locais', () => {
  it('mantém título e volta acessíveis enquanto consulta, sem anunciar histórico vazio', async () => {
    const wrapper = await render()
    expect(wrapper.get('h1').text()).toBe('Rodadas locais')
    expect(wrapper.get('a').attributes('href')).toBe('/replenishment')
    expect(wrapper.get('[role="status"]').text()).toContain('Carregando rodadas locais')
    expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.findComponent({ name: 'PurchaseDraftHistory' }).exists()).toBe(false)
    data.value = { drafts: [] }; status.value = 'success'
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'PurchaseDraftHistory' }).props('drafts')).toEqual([])
  })
  it('encaminha falha e tentativa novamente ao histórico sem perder navegação', async () => {
    error.value = new Error('Synthetic unavailable'); status.value = 'error'
    const wrapper = await render()
    const history = wrapper.findComponent({ name: 'PurchaseDraftHistory' })
    expect(history.props('error')).toBe('Não foi possível consultar o histórico de rodadas.')
    expect(wrapper.get('a').attributes('href')).toBe('/replenishment')
    history.vm.$emit('retry')
    await flushPromises()
    expect(refresh).toHaveBeenCalledOnce()
  })
})
