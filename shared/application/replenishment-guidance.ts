import type { Recommendation } from '../types/replenishment'
import { describeReplenishmentIssue } from './replenishment-issues'

const policyFields: Record<string, string> = {
  windowDays: 'Janela de consumo: período de vendas usado no cálculo, em dias.',
  leadDays: 'Prazo do fornecedor: dias previstos para a entrega.',
  reviewDays: 'Intervalo de revisão: dias entre as revisões de compra.',
  safetyUnits: 'Segurança: quantidade de unidades mantida como reserva.',
  minimum: 'Estoque mínimo: quantidade mínima desejada, em unidades.',
  packSize: 'Unidades por embalagem: quantidade de unidades em cada embalagem de compra.',
  supplierId: 'Fornecedor: identificador de um fornecedor cadastrado no ERP e sincronizado.',
}

export interface ReplenishmentGuidanceGroup {
  source: 'erp' | 'local' | 'integration'
  title: string
  action: string
  checks: string[]
  issues: string[]
}

/** Guidance describes known omissions without treating unknown source contracts as editable fields. */
export function getReplenishmentGuidance(item: Recommendation): ReplenishmentGuidanceGroup[] {
  const erp: ReplenishmentGuidanceGroup = {
    source: 'erp', title: 'Conferir no ERP',
    action: 'Confira o cadastro no ERP. Depois de corrigir, peça ao administrador para usar Atualizar agora no Grand Cru.',
    checks: [], issues: [],
  }
  const local: ReplenishmentGuidanceGroup = {
    source: 'local', title: 'Configurar no Grand Cru',
    action: 'Um administrador pode abrir Parâmetros de compra neste produto e salvar os valores locais.',
    checks: [], issues: [],
  }
  const integration: ReplenishmentGuidanceGroup = {
    source: 'integration', title: 'Depende da validação da integração',
    action: 'Peça à equipe responsável pela integração para conferir estas informações. Preencher o ERP ou salvar parâmetros locais, sozinho, não resolve esta etapa.',
    checks: [], issues: [],
  }

  if (!item.product.supplierId) erp.checks.push('Vincular o fornecedor ao produto e conferir se o fornecedor está cadastrado.')
  if (!item.product.purchaseUnit?.trim()) erp.checks.push('Informar a unidade de compra do produto, como caixa ou unidade.')
  if (item.product.packSize === null || item.product.packSize <= 0) erp.checks.push('Informar quantas unidades existem em cada embalagem de compra.')

  for (const issue of item.issues) {
    if (issue.startsWith('PRODUCT_PURCHASE_PARAMETERS_MISSING:') || ['PRODUCT_ID_OR_FIELDS_INVALID', 'SUPPLIER_ID_OR_FIELDS_INVALID'].includes(issue)) {
      erp.issues.push(describeReplenishmentIssue(issue))
      if (issue.startsWith('PRODUCT_PURCHASE_PARAMETERS_MISSING:') && item.product.supplierId) {
        erp.checks.push('Conferir se o fornecedor vinculado está cadastrado e foi sincronizado. O aviso não identifica sozinho qual campo está incorreto.')
      }
      if (issue === 'PRODUCT_ID_OR_FIELDS_INVALID') erp.checks.push('Conferir identificação e descrição dos produtos no cadastro de origem.')
      if (issue === 'SUPPLIER_ID_OR_FIELDS_INVALID') erp.checks.push('Conferir identificação e nome dos fornecedores no cadastro de origem.')
      continue
    }

    const field = /^(?:Parâmetro obrigatório|Parâmetro inválido|Parâmetro inteiro obrigatório|Limite operacional de 3650 dias excedido): (.+)$/.exec(issue)?.[1]
    if (field && Object.hasOwn(policyFields, field)) {
      local.checks.push(policyFields[field]!)
      local.issues.push('Há um parâmetro local ausente ou inválido. Confira o campo indicado.')
    } else if (issue === 'Política de reposição não configurada' || issue === 'Política inválida') {
      local.issues.push(issue === 'Política inválida' ? 'Os parâmetros locais precisam ser conferidos.' : 'Os parâmetros locais ainda não foram configurados.')
      local.checks.push(...Object.values(policyFields))
    } else if (issue === 'Janela e embalagem devem ser positivas') {
      local.issues.push('A janela de consumo e as unidades por embalagem devem ser maiores que zero.')
      local.checks.push(policyFields.windowDays!, policyFields.packSize!)
    } else if (issue === 'Custo inválido') {
      local.issues.push('O custo é opcional; se informado, precisa ser um valor válido e não negativo.')
    } else if (issue === 'Fornecedor configurado não encontrado na fonte') {
      local.issues.push('O fornecedor informado nos parâmetros não foi encontrado nos cadastros sincronizados.')
      local.checks.push(policyFields.supplierId!)
    } else {
      integration.issues.push(field ? 'Há uma inconsistência na configuração salva. Solicite análise à equipe responsável.' : describeReplenishmentIssue(issue))
    }
  }

  return [erp, local, integration].filter(group => group.checks.length || group.issues.length)
    .map(group => ({ ...group, checks: [...new Set(group.checks)], issues: [...new Set(group.issues)] }))
}
