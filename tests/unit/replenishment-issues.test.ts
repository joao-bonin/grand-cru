import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { describeReplenishmentIssue, summarizeReplenishmentIssues } from '../../shared/application/replenishment-issues'
import ReplenishmentDataIssues from '../../app/components/ReplenishmentDataIssues.vue'
import ReplenishmentExplanation from '../../app/components/ReplenishmentExplanation.vue'
import { recommendation } from '../fixtures/replenishment'

describe('pendências em linguagem de negócio', () => {
  it('explica o SKU sem afirmar qual parâmetro está ausente', () => {
    expect(describeReplenishmentIssue('PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429')).toBe('SKU 1000008429: parâmetros de compra incompletos. Confira fornecedor, embalagem e unidade de compra nos dados de origem.')
  })
  it('resume milhares de produtos contando SKUs únicos', () => {
    const issues = Array.from({ length: 3000 }, (_, index) => `PRODUCT_PURCHASE_PARAMETERS_MISSING:${index}`)
    issues.push(issues[0]!)
    const original = [...issues]
    expect(summarizeReplenishmentIssues(issues)).toEqual(['Parâmetros de compra incompletos em 3000 produtos. Confira fornecedor, embalagem e unidade de compra nos dados de origem.'])
    expect(issues).toEqual(original)
    const wrapper = mount(ReplenishmentDataIssues, { props: { issues } })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.text()).toContain('3000 produtos')
    expect(wrapper.text()).not.toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING')
  })
  it('traduz fontes conhecidas e usa aviso seguro para código desconhecido', () => {
    expect(describeReplenishmentIssue('SALES_HISTORY_COVERAGE_UNCONFIRMED')).toBe('O histórico de vendas ainda não está comprovado para todo o período.')
    expect(describeReplenishmentIssue('RETURNS_RECONCILIATION_UNCONFIRMED')).toBe('As devoluções ainda precisam ser conciliadas com as vendas de origem.')
    expect(describeReplenishmentIssue('UNKNOWN_TECHNICAL_CODE:synthetic-private-value')).toBe('Há dados da integração pendentes de validação. As sugestões dependentes continuam indisponíveis.')
    expect(describeReplenishmentIssue('Reservas desconhecidas')).toBe('Reservas desconhecidas')
    expect(summarizeReplenishmentIssues(['SALES_HISTORY_COVERAGE_UNCONFIRMED', 'SALES_HISTORY_COVERAGE_UNCONFIRMED'])).toHaveLength(1)
  })
  it('mostra a orientação no detalhe sem remover bloqueios nem alterar a recomendação', () => {
    const item = { ...recommendation, suggested: null, issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429', 'RETURNS_RECONCILIATION_UNCONFIRMED'] }
    const wrapper = mount(ReplenishmentExplanation, { props: { item } })
    expect(wrapper.text()).toContain('SKU 1000008429: parâmetros de compra incompletos')
    expect(wrapper.text()).toContain('As devoluções ainda precisam ser conciliadas')
    expect(wrapper.text()).not.toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING')
    expect(wrapper.get('[data-field="suggested"]').text()).toBe('Indisponível')
    expect(item.issues).toEqual(['PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429', 'RETURNS_RECONCILIATION_UNCONFIRMED'])
  })
  it('não exibe um aviso vazio', () => {
    expect(mount(ReplenishmentDataIssues, { props: { issues: [] } }).find('section').exists()).toBe(false)
    expect(summarizeReplenishmentIssues(['PRODUCT_PURCHASE_PARAMETERS_MISSING:1'])).toEqual(['Parâmetros de compra incompletos em 1 produto. Confira fornecedor, embalagem e unidade de compra nos dados de origem.'])
  })
})
