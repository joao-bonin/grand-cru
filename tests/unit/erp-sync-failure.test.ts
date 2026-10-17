import { describe, expect, it } from 'vitest'
import { ErpSyncFailure, synchronizationErrorMessage } from '../../server/application/erp/sync-failure'
import type { ErpSyncSource } from '../../server/application/erp/sync-failure'

describe('SV-02 safe source-specific synchronization failures', () => {
  it('names the stock source and deadline without private cause data', () => {
    const failure = new ErpSyncFailure('stock', new Error('ERP_SYNC_DEADLINE'))
    expect(failure).toMatchObject({ source: 'stock', message: 'ERP_SYNC_DEADLINE' })
    expect(failure.cause).toBeUndefined()
    expect(synchronizationErrorMessage(failure)).toBe('Falha na leitura de estoque: prazo da sincronização esgotado. A versão anterior foi preservada. [ERP_SYNC_DEADLINE]')
  })
  it('identifies HTTP rejection by a fixed source and status', () => {
    expect(synchronizationErrorMessage(new ErpSyncFailure('suppliers', new Error('ERP_HTTP_403')))).toBe('Falha na leitura de fornecedores: ERP respondeu HTTP 403. A versão anterior foi preservada. [ERP_HTTP_403]')
  })
  it.each(['synthetic-private-token SELECT password FROM users', 'ERP_SYNTHETIC_SECRET', 'ERP_HTTP_500 synthetic-private-body'])('redacts arbitrary errors: %s', message => {
    const failure = new ErpSyncFailure('products', new Error(message))
    expect(failure.message).toBe('ERP_SOURCE_INVALID')
    expect(synchronizationErrorMessage(failure)).toBe('Falha na leitura de produtos: dados retornados pelo ERP não puderam ser validados. A versão anterior foi preservada. [ERP_SOURCE_INVALID]')
    expect(JSON.stringify(failure)).not.toContain('synthetic-private')
  })
  it('redacts unexpected source names and keeps the existing generic fallback', () => {
    expect(new ErpSyncFailure('synthetic-private-source' as ErpSyncSource, null).source).toBe('unknown')
    expect(synchronizationErrorMessage(new Error('synthetic-private-error'))).toBe('Não foi possível concluir a leitura do ERP. Confira autenticação e fontes; a versão anterior foi preservada.')
  })
  it('preserves authentication-pending compatibility', () => {
    expect(synchronizationErrorMessage(new Error('ERP_AUTHENTICATION_PENDING'))).toBe('ERP_AUTHENTICATION_PENDING')
    expect(synchronizationErrorMessage(new ErpSyncFailure('products', new Error('ERP_AUTHENTICATION_PENDING')))).toBe('ERP_AUTHENTICATION_PENDING')
  })
  it.each([
    ['ERP_TRANSPORT_FAILED', 'a consulta não concluiu no prazo ou a conexão falhou'],
    ['ERP_AUTH_TRANSPORT_FAILED', 'a consulta não concluiu no prazo ou a conexão falhou'],
    ['ERP_TOKEN_DECRYPTION_FAILED', 'não foi possível recuperar a sessão segura da integração'],
    ['ERP_SESSION_STORAGE_FAILED', 'não foi possível recuperar a sessão segura da integração'],
    ['ERP_PURCHASE_UNITS_UNCONFIRMED', 'as unidades ou os atendimentos das compras ainda não estão conciliados'],
  ])('classifies %s without exposing payloads', (code, reason) => {
    expect(synchronizationErrorMessage(new ErpSyncFailure('purchases', new Error(code)))).toBe(`Falha na leitura de pedidos de compra: ${reason}. A versão anterior foi preservada. [${code}]`)
  })
})
