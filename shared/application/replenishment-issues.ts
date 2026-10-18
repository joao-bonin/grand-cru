const purchaseParametersPrefix = 'PRODUCT_PURCHASE_PARAMETERS_MISSING:'
const parameterGuidance = 'Confira fornecedor, embalagem e unidade de compra nos dados de origem.'
const knownIssues: Record<string, string> = {
  SALES_HISTORY_COVERAGE_UNCONFIRMED: 'O histórico de vendas ainda não está comprovado para todo o período.',
  RETURNS_RECONCILIATION_UNCONFIRMED: 'As devoluções ainda precisam ser conciliadas com as vendas de origem.',
  SUPPLIER_ID_OR_FIELDS_INVALID: 'Há fornecedores com identificação ou dados incompletos na origem.',
  PRODUCT_ID_OR_FIELDS_INVALID: 'Há produtos com identificação ou dados incompletos na origem.',
}

/** Presentation only: the original domain codes still block dependent calculations. */
export function describeReplenishmentIssue(issue: string): string {
  if (issue.startsWith(purchaseParametersPrefix)) return `SKU ${issue.slice(purchaseParametersPrefix.length)}: parâmetros de compra incompletos. ${parameterGuidance}`
  if (Object.hasOwn(knownIssues, issue)) return knownIssues[issue]!
  if (/^[A-Z][A-Z0-9_]*(?::|$)/.test(issue)) return 'Há dados da integração pendentes de validação. As sugestões dependentes continuam indisponíveis.'
  return issue
}

export function summarizeReplenishmentIssues(issues: string[]): string[] {
  const products = new Set(issues.filter(issue => issue.startsWith(purchaseParametersPrefix)).map(issue => issue.slice(purchaseParametersPrefix.length)))
  const summary = products.size ? [`Parâmetros de compra incompletos em ${products.size} ${products.size === 1 ? 'produto' : 'produtos'}. ${parameterGuidance}`] : []
  return [...summary, ...new Set(issues.filter(issue => !issue.startsWith(purchaseParametersPrefix)).map(describeReplenishmentIssue))]
}
