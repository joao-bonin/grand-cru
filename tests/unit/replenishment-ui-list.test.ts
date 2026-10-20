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
  it('associa o controle bloqueado a um motivo visível e oferece explicação sem código técnico', () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [{ ...recommendation, suggested: null, issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:p1'] }], canSelect: true } })
    const control = wrapper.get('[name="select-p1-s1"]')
    const hint = wrapper.get('.replenishment-selection-help > p')
    expect(control.attributes('aria-describedby')).toBe(hint.attributes('id'))
    expect(hint.text()).toContain('dados de compra pendentes')
    expect(wrapper.get('.replenishment-selection-help summary').text()).toBe('Por que não posso selecionar?')
    expect(wrapper.get('.replenishment-selection-help').text()).toContain('equipe de integração')
    expect(wrapper.text()).not.toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING')
  })
  it('explica ausência de política e mantém zero calculado disponível para seleção', async () => {
    const missing = mount(ReplenishmentList, { props: { items: [{ ...recommendation, policy: null }], canSelect: true } })
    expect(missing.get('[name="select-p1-s1"]').attributes('disabled')).toBeDefined()
    expect(missing.get('.replenishment-selection-help > p').text()).toContain('Parâmetros de compra pendentes')
    expect(missing.text()).toContain('salvos somente no Grand Cru')
    const zero = mount(ReplenishmentList, { props: { items: [{ ...recommendation, suggested: 0 }], canSelect: true } })
    expect(zero.get('[name="select-p1-s1"]').attributes('disabled')).toBeUndefined()
    expect(zero.find('.replenishment-selection-help').exists()).toBe(false)
    await zero.get('[name="select-p1-s1"]').setValue(true)
    expect(zero.emitted('selection')?.at(-1)).toEqual([[{ productId: 'p1', storeId: 's1' }]])
  })
  it('não emite um item bloqueado mesmo após um evento forjado e limpa seleção ao perder permissão', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [{ ...recommendation, issues: ['Saldo não comprovado'] }], canSelect: true } })
    const control = wrapper.get('[name="select-p1-s1"]')
    const input = control.element as HTMLInputElement
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('selection')?.at(-1)).toEqual([[]])
    await wrapper.setProps({ items: [recommendation] })
    await wrapper.get('[name="select-p1-s1"]').setValue(true)
    await wrapper.setProps({ canSelect: false })
    expect(wrapper.emitted('selection')?.at(-1)).toEqual([[]])
    expect(wrapper.find('[name="select-p1-s1"]').exists()).toBe(false)
    expect(wrapper.find('.replenishment-selection-help').exists()).toBe(false)
  })
})
