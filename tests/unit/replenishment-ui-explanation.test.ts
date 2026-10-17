import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReplenishmentExplanation from '../../app/components/ReplenishmentExplanation.vue'
import { recommendation } from '../fixtures/replenishment'
describe('US06 memória do cálculo', () => {
  it('mostra parcelas, janela, origem e arredondamento do exemplo da spec', () => {
    const wrapper = mount(ReplenishmentExplanation, { props: { item: recommendation } })
    for (const text of ['snapshot-1', '90 dias', '7 unidades', '12 unidades', '6 unidades', '2 embalagens', 'parcial', 'Vendas totais', 'Giro indisponível']) expect(wrapper.text()).toContain(text)
    expect(wrapper.get('[data-field="target"]').text()).toBe('23 unidades')
    expect(wrapper.get('[data-field="available"]').text()).toBe('16 unidades')
  })
  it('distingue indisponível de zero e explica pendências', () => {
    const wrapper = mount(ReplenishmentExplanation, { props: { item: { ...recommendation, available: null, suggested: null, raw: null, issues: ['Reservas desconhecidas'] } } })
    expect(wrapper.text()).toContain('Reservas desconhecidas')
    expect(wrapper.get('[data-field="suggested"]').text()).toBe('Indisponível')
    expect(wrapper.get('[data-field="pending"]').text()).toBe('0 unidades')
  })
})
