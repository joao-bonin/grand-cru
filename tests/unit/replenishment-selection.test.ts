import { describe, expect, it } from 'vitest'
import { canSelectRecommendation, recommendationSelectionIssues } from '../../shared/application/replenishment-selection'
import { summarizeReplenishmentIssues } from '../../shared/presentation/replenishment-issues'
import { recommendation } from '../fixtures/replenishment'

describe('Disponibilidade da seleção e seus motivos', () => {
  it('permite uma sugestão calculada igual a zero e distingue dado indisponível', () => {
    expect(canSelectRecommendation({ ...recommendation, suggested: 0 })).toBe(true)
    expect(recommendationSelectionIssues(recommendation)).toEqual([])
    const unknown = { ...recommendation, suggested: null }
    expect(canSelectRecommendation(unknown)).toBe(false)
    expect(summarizeReplenishmentIssues(recommendationSelectionIssues(unknown))[0]!.title).toContain('sugestão de compra válida')
  })
  it('explica todos os bloqueios de origem e de parâmetros sem liberar um cálculo incompleto', () => {
    const item = { ...recommendation, suggested: null, policy: null, issues: ['SALES_HISTORY_COVERAGE_UNCONFIRMED', 'RETURNS_RECONCILIATION_UNCONFIRMED'] }
    const before = [...item.issues]
    const notices = summarizeReplenishmentIssues(recommendationSelectionIssues(item))
    expect(canSelectRecommendation(item)).toBe(false)
    expect(notices.map(notice => notice.title)).toEqual([
      'O período do histórico de vendas ainda precisa ser confirmado', 'As devoluções ainda precisam ser conferidas', 'Parâmetros de compra pendentes',
    ])
    expect(notices.at(-1)!.description).toContain('somente no Grand Cru')
    expect(item.issues).toEqual(before)
  })
  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('recusa uma sugestão sem quantidade válida (%s)', suggested => {
    const item = { ...recommendation, suggested }
    expect(canSelectRecommendation(item)).toBe(false)
    expect(recommendationSelectionIssues(item)).toEqual(['Sugestão de compra indisponível'])
  })
  it('explica a dependência de reservas e estoque em termos de negócio', () => {
    const item = { ...recommendation, suggested: null, issues: ['Relação entre reservas e bloqueios não comprovada'] }
    const notice = summarizeReplenishmentIssues(recommendationSelectionIssues(item))[0]!
    expect(notice.title).toContain('reservas e os bloqueios')
    expect(notice.description).toContain('depende dos dados do ERP')
  })
})
