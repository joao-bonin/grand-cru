import { describe, expect, it } from 'vitest'
import { getReplenishmentGuidance } from '../../shared/application/replenishment-guidance'
import { recommendation } from '../fixtures/replenishment'

describe('orientação para liberar seleção', () => {
  it('separa cadastro, parâmetros locais e validação sem alterar dados nem remover pendências', () => {
    const item = {
      ...recommendation, suggested: null, policy: null,
      product: { ...recommendation.product, supplierId: null, purchaseUnit: null, packSize: null },
      issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:p1', 'Política de reposição não configurada', 'SALES_HISTORY_COVERAGE_UNCONFIRMED', 'RETURNS_RECONCILIATION_UNCONFIRMED', 'Relação entre reservas e bloqueios não comprovada'],
    }
    const original = structuredClone(item)
    const groups = getReplenishmentGuidance(item)
    expect(groups.map(group => group.source)).toEqual(['erp', 'local', 'integration'])
    const erp = groups.find(group => group.source === 'erp')!
    expect(erp.checks).toHaveLength(3)
    expect(erp.checks.join(' ')).toContain('unidade de compra')
    expect(erp.action).toContain('Atualizar agora')
    const local = groups.find(group => group.source === 'local')!
    expect(local.checks).toHaveLength(7)
    expect(local.checks.join(' ')).toContain('Segurança')
    expect(local.checks.join(' ')).not.toContain('Custo')
    const integration = groups.find(group => group.source === 'integration')!
    expect(integration.issues).toHaveLength(3)
    expect(integration.action).toContain('sozinho, não resolve esta etapa')
    expect(item).toEqual(original)
  })
  it('não afirma qual campo está ausente quando o aviso agregado não permite concluir', () => {
    const groups = getReplenishmentGuidance({ ...recommendation, suggested: null, issues: ['PRODUCT_PURCHASE_PARAMETERS_MISSING:p1'] })
    expect(groups).toHaveLength(1)
    expect(groups[0]!.checks).toEqual(['Conferir se o fornecedor vinculado está cadastrado e foi sincronizado. O aviso não identifica sozinho qual campo está incorreto.'])
    expect(groups[0]!.checks.join(' ')).not.toContain('Informar a unidade')
  })
  it('indica o campo local reconhecido sem exibir nomes internos', () => {
    const groups = getReplenishmentGuidance({ ...recommendation, policy: null, suggested: null, issues: ['Parâmetro inválido: windowDays'] })
    expect(groups.map(group => group.source)).toEqual(['local'])
    expect(groups[0]!.checks).toEqual(['Janela de consumo: período de vendas usado no cálculo, em dias.'])
    expect(JSON.stringify(groups)).not.toContain('windowDays')
  })
  it('trata custo inválido como opcional e fornecedor desconhecido como conferência local', () => {
    const groups = getReplenishmentGuidance({ ...recommendation, suggested: null, issues: ['Custo inválido', 'Fornecedor configurado não encontrado na fonte'] })
    expect(groups).toHaveLength(1)
    expect(groups[0]!.source).toBe('local')
    expect(groups[0]!.issues[0]).toContain('O custo é opcional')
    expect(groups[0]!.checks).toHaveLength(1)
    expect(groups[0]!.checks[0]).toContain('Fornecedor')
  })
  it('encaminha falhas desconhecidas e metadados internos à equipe sem expor códigos', () => {
    const groups = getReplenishmentGuidance({ ...recommendation, suggested: null, issues: ['UNKNOWN_TECHNICAL_CODE:synthetic-private-value', 'Parâmetro inválido: version'] })
    expect(groups.map(group => group.source)).toEqual(['integration'])
    const text = JSON.stringify(groups)
    expect(text).not.toContain('synthetic-private-value')
    expect(text).not.toContain('version')
    expect(groups[0]!.issues[1]).toContain('configuração salva')
  })
  it('não inventa pendências para uma recomendação completa', () => {
    expect(getReplenishmentGuidance(recommendation)).toEqual([])
  })
})
