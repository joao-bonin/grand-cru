import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReplenishmentList from '../../app/components/ReplenishmentList.vue'
import { recommendation } from '../fixtures/replenishment'
const items = [recommendation, { ...recommendation, product: { ...recommendation.product, id: 'p2', description: 'Outro vinho', supplierId: 'f2' }, ruptureDate: '2026-10-17', issues: ['Sem reservas'] }]
describe('US07 lista de reposição', () => {
  it('combina produto, fornecedor e pendências, prioriza ruptura e abre detalhe por toque', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items, canSelect: true } })
    expect(wrapper.findAll('article')[0]!.text()).toContain('Outro vinho')
    await wrapper.get('[name="product"]').setValue('reserva')
    await wrapper.get('[name="supplier"]').setValue('f1')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.findAll('article')[0]!.text()).toContain('Vinho reserva')
    await wrapper.get('summary').trigger('click')
    expect(wrapper.find('details').exists()).toBe(true)
    await wrapper.get('[name="issues"]').setValue(true)
    expect(wrapper.text()).toContain('Nenhum produto encontrado')
  })
  it('seleciona identidade completa e distingue falha de lista vazia', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [recommendation], canSelect: true } })
    await wrapper.get('[name="select-p1-s1"]').setValue(true)
    expect(wrapper.emitted('selection')).toEqual([[[{ productId: 'p1', storeId: 's1' }]]])
    await wrapper.setProps({ error: 'Consulta falhou', items: [] })
    expect(wrapper.text()).not.toContain('Nenhum produto encontrado')
    await wrapper.get('[data-retry]').trigger('click')
    expect(wrapper.emitted('retry')).toEqual([[]])
  })
  it('remove seleção quando o resultado atualizado está indisponível', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [recommendation], canSelect: true } })
    await wrapper.get('[name="select-p1-s1"]').setValue(true)
    await wrapper.setProps({ items: [{ ...recommendation, suggested: null }] })
    expect(wrapper.emitted('selection')?.at(-1)).toEqual([[]])
    expect((wrapper.get('[name="select-p1-s1"]').element as HTMLInputElement).checked).toBe(false)
  })
  it('impede seleção de resultado indisponível', () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [{ ...recommendation, suggested: null }], canSelect: true } })
    expect(wrapper.get('[name="select-p1-s1"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Indisponível')
  })
})
