export interface ReplenishmentNotice {
  key: string
  title: string
  description: string
}

const purchaseParametersPrefix = 'PRODUCT_PURCHASE_PARAMETERS_MISSING:'
const purchaseParametersDescription = 'Confira o fornecedor, a unidade de compra e a quantidade por embalagem no ERP. Se já estiverem preenchidos, peça à equipe de integração para conferir a leitura desses dados. Até lá, as sugestões desses produtos ficam pendentes.'
const notices: Record<string, Omit<ReplenishmentNotice, 'key'>> = {
  'Política de reposição não configurada': {
    title: 'Parâmetros de compra pendentes',
    description: 'Abra “Parâmetros de compra” e confira ou preencha os campos obrigatórios. Esses parâmetros são salvos somente no Grand Cru.',
  },
  'Sugestão de compra indisponível': {
    title: 'Ainda não há uma sugestão de compra válida',
    description: 'Confira os dados do produto e os parâmetros de compra. A seleção é liberada quando houver uma sugestão calculada sem pendências.',
  },
  'Saldo não comprovado': {
    title: 'O estoque disponível ainda não foi confirmado',
    description: 'Confira o saldo deste produto no ERP e sua leitura pela integração. Esse dado é necessário para calcular a sugestão.',
  },
  'Saldo conflitante para o mesmo local': {
    title: 'Há saldos diferentes para o mesmo local de estoque',
    description: 'A integração precisa conferir os saldos recebidos do ERP antes de calcular a quantidade disponível.',
  },
  'Relação entre reservas e bloqueios não comprovada': {
    title: 'As reservas e os bloqueios do estoque ainda não foram confirmados',
    description: 'A integração precisa confirmar o que está reservado ou bloqueado para calcular quanto está disponível. Essa conferência depende dos dados do ERP.',
  },
  'Histórico insuficiente para a janela configurada': {
    title: 'O histórico de vendas é insuficiente para o período escolhido',
    description: 'Confira o período de vendas disponível e a janela de consumo nos parâmetros de compra. O cálculo exige o histórico completo para esse período.',
  },
  'Fornecedor configurado não encontrado na fonte': {
    title: 'O fornecedor escolhido não foi confirmado nos dados recebidos',
    description: 'Confira o fornecedor nos parâmetros de compra e no ERP. Se o cadastro já existir, peça à equipe de integração para conferir sua leitura.',
  },
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
