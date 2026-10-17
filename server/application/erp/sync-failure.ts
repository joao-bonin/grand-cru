const sources = { products: 'produtos', suppliers: 'fornecedores', stock: 'estoque', coupons: 'cupons de venda', returns: 'devoluções', purchases: 'pedidos de compra', unknown: 'dados do ERP' } as const
export type ErpSyncSource = keyof typeof sources
const knownCodes = new Set([
  'ERP_AUTHENTICATION_PENDING', 'ERP_SYNC_DEADLINE', 'ERP_PAGINATION_INVALID', 'ERP_PAGINATION_REPEATED', 'ERP_PAGINATION_LIMIT',
  'ERP_TRANSPORT_FAILED', 'ERP_RESPONSE_TOO_LARGE', 'ERP_INVALID_JSON', 'ERP_NUMERIC_PRECISION_INVALID',
  'ERP_STOCK_BALANCE_INVALID', 'ERP_SALE_FIELDS_INVALID', 'ERP_SALE_IDENTITY_CONFLICT', 'ERP_PURCHASE_UNITS_UNCONFIRMED',
  'ERP_PURCHASE_QUANTITY_INVALID', 'ERP_PURCHASE_RESPONSE_INVALID', 'ERP_RECORD_INVALID', 'ERP_ID_INVALID',
  'ERP_AUTH_RESPONSE_INVALID', 'ERP_AUTH_TRANSPORT_FAILED', 'ERP_AUTH_REJECTED', 'ERP_SESSION_STORAGE_FAILED',
  'ERP_TOKEN_DECRYPTION_FAILED', 'ERP_TOKEN_ENCRYPTION_FAILED', 'ERP_SESSION_EXPIRY_INVALID', 'ERP_SOURCE_INVALID',
])
function safeCode(error: unknown) {
  const code = error instanceof Error ? error.message : ''
  return knownCodes.has(code) || /^ERP_(AUTH_)?HTTP_[345]\d\d$/.test(code) ? code : 'ERP_SOURCE_INVALID'
}

/** Context contains only fixed source labels and known codes, never the remote body/cause. */
export class ErpSyncFailure extends Error {
  readonly source: ErpSyncSource
  constructor(source: ErpSyncSource, error: unknown) {
    super(safeCode(error))
    this.name = 'ErpSyncFailure'
    this.source = Object.hasOwn(sources, source) ? source : 'unknown'
  }
}

export function synchronizationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'ERP_AUTHENTICATION_PENDING') return 'ERP_AUTHENTICATION_PENDING'
  if (!(error instanceof ErpSyncFailure)) return 'Não foi possível concluir a leitura do ERP. Confira autenticação e fontes; a versão anterior foi preservada.'
  const code = safeCode(error)
  let reason = 'dados retornados pelo ERP não puderam ser validados'
  if (code === 'ERP_SYNC_DEADLINE') reason = 'prazo da sincronização esgotado'
  else if (/^ERP_(AUTH_)?HTTP_[345]\d\d$/.test(code)) reason = `ERP respondeu HTTP ${code.slice(-3)}`
  else if (code === 'ERP_TRANSPORT_FAILED' || code === 'ERP_AUTH_TRANSPORT_FAILED') reason = 'a consulta não concluiu no prazo ou a conexão falhou'
  else if (code === 'ERP_SESSION_STORAGE_FAILED' || code === 'ERP_TOKEN_DECRYPTION_FAILED' || code === 'ERP_TOKEN_ENCRYPTION_FAILED') reason = 'não foi possível recuperar a sessão segura da integração'
  else if (code === 'ERP_PURCHASE_UNITS_UNCONFIRMED') reason = 'as unidades ou os atendimentos das compras ainda não estão conciliados'
  return `Falha na leitura de ${sources[error.source]}: ${reason}. A versão anterior foi preservada. [${code}]`
}
