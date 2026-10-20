export interface ReplenishmentNotice {
  key: string
  title: string
  description: string
}

const purchaseParametersPrefix = 'PRODUCT_PURCHASE_PARAMETERS_MISSING:'
const purchaseParametersDescription = 'Confira o fornecedor, a unidade de compra e a quantidade por embalagem no ERP. Se já estiverem preenchidos, peça à equipe de integração para conferir a leitura desses dados. Até lá, as sugestões desses produtos ficam pendentes.'
const notices: Record<string, Omit<ReplenishmentNotice, 'key'>> = {
  SALES_HISTORY_COVERAGE_UNCONFIRMED: {
    title: 'O período do histórico de vendas ainda precisa ser confirmado',
    description: 'A integração precisa confirmar se há vendas suficientes para o período escolhido. Até lá, as sugestões afetadas ficam pendentes.',
  },
  RETURNS_RECONCILIATION_UNCONFIRMED: {
    title: 'As devoluções ainda precisam ser conferidas',
    description: 'A integração precisa validar como as devoluções são descontadas das vendas para calcular a compra corretamente.',
  },
  SUPPLIER_ID_OR_FIELDS_INVALID: {
    title: 'Não foi possível confirmar alguns fornecedores',
    description: 'Confira a identificação e o nome dos fornecedores no ERP e atualize os dados.',
  },
  PRODUCT_ID_OR_FIELDS_INVALID: {
    title: 'Alguns produtos não puderam ser consultados',
    description: 'Confira a identificação e a descrição dos produtos no ERP e atualize os dados.',
  },
}
const unknownNotice: ReplenishmentNotice = {
  key: 'unconfirmed-data', title: 'Há outras informações que precisam de conferência',
  description: 'Parte dos dados ainda não pôde ser confirmada. Se a pendência continuar após a atualização, peça apoio à equipe responsável pela integração.',
}

export function explainReplenishmentIssue(issue: string): ReplenishmentNotice {
  if (issue.startsWith(purchaseParametersPrefix) || issue === 'PRODUCT_PURCHASE_PARAMETERS_MISSING') {
    return { key: 'purchase-parameters', title: 'Dados de compra pendentes', description: purchaseParametersDescription }
  }
  if (Object.hasOwn(notices, issue)) return { key: issue, ...notices[issue]! }
  // Source identifiers are useful for diagnostics, but are not instructions to the buyer.
  if (/[A-Z][A-Z0-9]*_/.test(issue) || /^[A-Z0-9_:.-]+$/.test(issue)) return { ...unknownNotice }
  return { key: issue, title: issue, description: '' }
}

export function summarizeReplenishmentIssues(issues: readonly string[]): ReplenishmentNotice[] {
  const result = new Map<string, ReplenishmentNotice>()
  const productIds = new Set(issues.filter(issue => issue.startsWith(purchaseParametersPrefix))
    .map(issue => issue.slice(purchaseParametersPrefix.length).trim()).filter(Boolean))
  for (const issue of issues) {
    if (!issue.trim()) continue
    const notice = explainReplenishmentIssue(issue)
    result.set(notice.key, notice)
  }
  const purchaseParameters = result.get('purchase-parameters')
  if (purchaseParameters && productIds.size) purchaseParameters.title = productIds.size === 1
    ? '1 produto está com dados de compra pendentes'
    : `${productIds.size.toLocaleString('pt-BR')} produtos estão com dados de compra pendentes`
  return [...result.values()]
}
