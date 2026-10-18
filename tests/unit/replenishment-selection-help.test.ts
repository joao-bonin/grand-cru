import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import ReplenishmentSelectionHelp from '../../app/components/ReplenishmentSelectionHelp.vue'
import ReplenishmentList from '../../app/components/ReplenishmentList.vue'
import { recommendation } from '../fixtures/replenishment'

const blocked = { ...recommendation, suggested: null, policy: null, issues: ['Política de reposição não configurada', 'SALES_HISTORY_COVERAGE_UNCONFIRMED'] }

describe('ajuda por toque no checkbox desabilitado', () => {
  it('abre por botão, associa o conteúdo e separa preenchimento de validação da integração', async () => {
    const wrapper = mount(ReplenishmentSelectionHelp, { props: { item: blocked } })
    const trigger = wrapper.get('.replenishment-help-trigger')
    expect(trigger.attributes('aria-label')).toContain('Vinho reserva')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    await trigger.trigger('click')
    const panel = wrapper.get('[role="region"]')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.get('[data-source="local"]').text()).toContain('Janela de consumo')
    expect(panel.get('[data-source="local"]').text()).toContain('custo por unidade é opcional')
    expect(panel.get('[data-source="integration"]').text()).toContain('sozinho, não resolve esta etapa')
    expect(panel.text()).not.toContain('SALES_HISTORY_COVERAGE_UNCONFIRMED')
    await wrapper.get('.replenishment-help-close').trigger('click')
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })
  it('fecha por Escape com retorno ao acionador e por toque fora', async () => {
    const wrapper = mount(ReplenishmentSelectionHelp, { props: { item: blocked }, attachTo: document.body })
    const trigger = wrapper.get('.replenishment-help-trigger')
    await trigger.trigger('click')
    await wrapper.get('[role="region"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    await trigger.trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
    wrapper.unmount()
  })
  it('oferece atalho para parâmetros locais sem liberar a seleção', async () => {
    const wrapper = mount(ReplenishmentList, { props: { items: [blocked], canSelect: true } })
    await wrapper.get('[data-view="issues"]').trigger('click')
    const checkbox = wrapper.get('[name="select-p1-s1"]')
    expect(checkbox.attributes('disabled')).toBeDefined()
    await wrapper.get('.replenishment-help-trigger').trigger('click')
    const action = wrapper.findAll('[role="region"] button').find(button => button.text() === 'Abrir parâmetros de compra')!
    await action.trigger('click')
    expect(wrapper.emitted('policy')).toEqual([[blocked]])
    expect(checkbox.attributes('disabled')).toBeDefined()
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.emitted('selection')?.at(-1)).toEqual([[]])
  })
  it.each([
    { item: { ...recommendation, suggested: 0 }, pending: false, expected: 'zero unidades' },
    { item: blocked, pending: true, expected: 'Aguarde o carregamento' },
  ])('explica zero ou carregamento sem pedir preenchimento de campos', async ({ item, pending, expected }) => {
    const wrapper = mount(ReplenishmentSelectionHelp, { props: { item, pending } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('[role="region"]').text()).toContain(expected)
    expect(wrapper.find('[data-source]').exists()).toBe(false)
  })
  it('não oferece a ajuda de bloqueio para produto disponível nem ações a consultores', async () => {
    const available = mount(ReplenishmentList, { props: { items: [recommendation], canSelect: true } })
    expect(available.find('.replenishment-help-trigger').exists()).toBe(false)
    const readOnly = mount(ReplenishmentList, { props: { items: [blocked], canSelect: false } })
    await readOnly.get('[data-view="issues"]').trigger('click')
    expect(readOnly.find('.replenishment-help-trigger').exists()).toBe(false)
    expect(readOnly.find('input[type="checkbox"]').exists()).toBe(true)
    expect(readOnly.find('[name="select-p1-s1"]').exists()).toBe(false)
  })
  it('usa associações distintas para a ajuda de cada produto', async () => {
    const wrapper = mount(defineComponent({ render: () => h('div', [h(ReplenishmentSelectionHelp, { item: blocked }), h(ReplenishmentSelectionHelp, { item: { ...blocked, product: { ...blocked.product, id: 'p2' } } })]) }))
    const triggers = wrapper.findAll('.replenishment-help-trigger')
    expect(triggers[0]!.attributes('aria-controls')).not.toBe(triggers[1]!.attributes('aria-controls'))
  })
})
