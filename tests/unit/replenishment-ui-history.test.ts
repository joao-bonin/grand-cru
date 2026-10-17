import { mount } from '@vue/test-utils'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import PurchaseDraftHistory from '../../app/components/PurchaseDraftHistory.vue'
import type { PurchaseDraft } from '../../shared/types/replenishment'
const draft: PurchaseDraft = { id: 'd1', key: 'key1', author: 'ana', createdAt: '2026-10-16T12:00:00Z', snapshotId: 'snapshot-1', version: 1, state: 'draft', total: 240, items: [{ productId: 'p1', storeId: 's1', supplierId: 'f1', description: 'Vinho', suggested: 12, adjusted: 12, packSize: 6, unitCost: 20, policyVersion: 1 }] }
describe('US09 histórico local', () => {
  it('desabilita abertura no HTML SSR até os eventos serem conectados', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(PurchaseDraftHistory, { drafts: [draft] }) }))
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Abrir rodada d1/)
    const wrapper = mount(PurchaseDraftHistory, { props: { drafts: [draft] } })
    await nextTick()
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })
  it('mostra auditoria, sugestão, ajuste e grupo sem alegar aceite do ERP', async () => {
    const wrapper = mount(PurchaseDraftHistory, { props: { drafts: [{ ...draft, items: [{ ...draft.items[0]!, adjusted: 18 }] }] } })
    for (const text of ['ana', 'snapshot-1', 'Versão 1', 'f1', '12', '18', 'Rascunho local', 'não representa recebimento']) expect(wrapper.text()).toContain(text)
    expect(wrapper.text()).toContain('16/10/2026, 09:00:00')
    await nextTick()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')).toEqual([[expect.objectContaining({ id: 'd1', version: 1 })]])
  })
  it('mantém fornecedores separados com os respectivos itens', () => {
    const second = { ...draft.items[0]!, productId: 'p2', supplierId: 'f2', description: 'Espumante' }
    const wrapper = mount(PurchaseDraftHistory, { props: { drafts: [{ ...draft, items: [...draft.items, second] }] } })
    const groups = wrapper.findAll('article > div')
    expect(groups).toHaveLength(2)
    expect(groups[0]!.get('h4').text()).toBe('Fornecedor f1')
    expect(groups[0]!.get('li').text()).toBe('Vinho (p1) · sugestão 12 · ajuste 12')
    expect(groups[0]!.text()).not.toContain('Espumante')
    expect(groups[1]!.get('h4').text()).toBe('Fornecedor f2')
    expect(groups[1]!.get('li').text()).toBe('Espumante (p2) · sugestão 12 · ajuste 12')
    expect(groups[1]!.text()).not.toContain('Vinho')
  })
  it('distingue vazio e erro com tentativa novamente', async () => {
    const wrapper = mount(PurchaseDraftHistory, { props: { drafts: [] } })
    expect(wrapper.text()).toContain('Nenhuma rodada local')
    await wrapper.setProps({ error: 'Falha ao consultar' })
    expect(wrapper.text()).not.toContain('Nenhuma rodada local')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toEqual([[]])
  })
})
