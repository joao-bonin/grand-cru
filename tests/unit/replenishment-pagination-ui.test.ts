import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReplenishmentList from '../../app/components/ReplenishmentList.vue'
import { recommendation } from '../fixtures/replenishment'
const items = Array.from({ length: 20 }, (_, index) => ({ ...recommendation, product: { ...recommendation.product, id: `p${index}` } }))
const pagination = { start: 0, count: 20, total: 43, supplierIds: ['f1', 'f2'] }
describe('paginação da lista', () => {
  it('limita à página recebida e mostra limites e fornecedores globais', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items, pagination, canSelect: true } })
    expect(wrapper.findAll('article')).toHaveLength(20)
    const nav = wrapper.get('nav')
    expect(nav.text()).toContain('1–20 de 43 produtos')
    expect(nav.text()).toContain('Página 1 de 3')
    expect(nav.findAll('button')[0]!.attributes('disabled')).toBeDefined()
    expect(wrapper.get('option[value="f2"]').text()).toBe('f2')
    await wrapper.get('[name="select-p0-s1"]').setValue(true)
    await nav.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('page')).toEqual([[20]])
    expect(wrapper.emitted('selection')!.at(-1)).toEqual([[]])
    await wrapper.setProps({ pagination: { ...pagination, start: 40 }, items: items.slice(0, 3) })
    expect(nav.text()).toContain('41–43 de 43 produtos')
    expect(nav.findAll('button')[1]!.attributes('disabled')).toBeDefined()
    await nav.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('page')!.at(-1)).toEqual([20])
  })
  it('encaminha filtros ao conjunto completo em vez de filtrar apenas a página atual', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [recommendation], pagination, canSelect: true } })
    await wrapper.get('[name="select-p1-s1"]').setValue(true)
    await wrapper.get('[name="product"]').setValue('fora desta página')
    expect(wrapper.emitted('filters')!.at(-1)).toEqual([{ product: 'fora desta página', supplier: '', issues: false, risk: false }])
    expect(wrapper.emitted('selection')!.at(-1)).toEqual([[]])
    expect(wrapper.findAll('article')).toHaveLength(1)
  })
  it('desabilita navegação e seleção durante carga; diferencia vazio de erro', () => {
    const pending = mount(ReplenishmentList, { props: { items: [recommendation], pagination: { ...pagination, start: 20 }, canSelect: true, loading: true } })
    for (const button of pending.findAll('nav button')) expect(button.attributes('disabled')).toBeDefined()
    expect(pending.get('[name="select-p1-s1"]').attributes('disabled')).toBeDefined()
    const empty = mount(ReplenishmentList, { props: { items: [], pagination: { ...pagination, total: 0 } } })
    expect(empty.get('nav').text()).toContain('0–0 de 0 produtos')
    expect(empty.text()).toContain('Nenhum produto encontrado')
  })
})
