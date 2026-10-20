import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { explainReplenishmentIssue, summarizeReplenishmentIssues } from '../../shared/presentation/replenishment-issues'
import ReplenishmentIssues from '../../app/components/ReplenishmentIssues.vue'

describe('Pendências de reposição em linguagem de negócio', () => {
  it('resume muitos códigos em um aviso e conta produtos únicos, sem alterar a origem', () => {
    const issues = Array.from({ length: 1000 }, (_, index) => `PRODUCT_PURCHASE_PARAMETERS_MISSING:${index}`)
    issues.push(issues[0]!)
    const before = [...issues]
    const wrapper = mount(ReplenishmentIssues, { props: { issues } })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('1.000 produtos estão com dados de compra pendentes')
    expect(wrapper.text()).toContain('fornecedor, a unidade de compra e a quantidade por embalagem')
    expect(wrapper.text()).toContain('equipe de integração')
    expect(wrapper.text()).not.toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING')
    expect(issues).toEqual(before)
  })
  it('explica uma pendência individual sem mostrar o identificador técnico', () => {
    const wrapper = mount(ReplenishmentIssues, { props: { issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:1000009808'], compact: true } })
    expect(wrapper.text()).toContain('1 produto está com dados de compra pendentes')
    expect(wrapper.text()).not.toContain('1000009808')
    expect(wrapper.find('h2').exists()).toBe(false)
  })
  it('mantém separadas as orientações de histórico, devoluções e cadastros', () => {
    const notices = summarizeReplenishmentIssues(['SALES_HISTORY_COVERAGE_UNCONFIRMED', 'RETURNS_RECONCILIATION_UNCONFIRMED', 'SALES_HISTORY_COVERAGE_UNCONFIRMED', 'SUPPLIER_ID_OR_FIELDS_INVALID', 'PRODUCT_ID_OR_FIELDS_INVALID'])
    expect(notices).toHaveLength(4)
    expect(notices.map(item => item.title).join(' ')).toContain('histórico de vendas')
    expect(notices.map(item => item.title).join(' ')).toContain('devoluções')
    expect(notices.every(item => item.description.length > 0)).toBe(true)
  })
  it('agrupa códigos ainda desconhecidos em uma orientação segura, sem descartá-los silenciosamente', () => {
    const wrapper = mount(ReplenishmentIssues, { props: { issues: ['NEW_SOURCE_PENDING:1', 'OTHER_SOURCE_PENDING:2'] } })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Há outras informações que precisam de conferência')
    expect(wrapper.text()).not.toContain('SOURCE_PENDING')
  })
  it('preserva motivos do domínio que já estão em português e não inventa quantidade sem SKU', () => {
    expect(explainReplenishmentIssue('Reservas desconhecidas').title).toBe('Reservas desconhecidas')
    expect(summarizeReplenishmentIssues(['PRODUCT_PURCHASE_PARAMETERS_MISSING:'])[0]!.title).toBe('Dados de compra pendentes')
  })
  it('não cria aviso quando não há pendências', () => {
    expect(mount(ReplenishmentIssues, { props: { issues: [] } }).find('section').exists()).toBe(false)
  })
})
