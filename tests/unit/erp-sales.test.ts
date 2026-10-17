import { describe, expect, it } from 'vitest'
import { mapSales } from '../../server/infrastructure/erp/sales-mapper'

const coupon = { id: 'C1', lojaId: 1, dataVenda: '2026-10-15', cancelada: false, notaFiscalId: 8, itensVenda: [{ id: 1, produtoId: 5, quantidadeVenda: 10, tipo: '1' }, { id: 2, produtoId: 6, quantidadeVenda: 2, tipo: '2' }] }
describe('sales CV-04', () => {
  it('preserves coupon and item identity and cancellation without personal data', () => {
    expect(mapSales([{ ...coupon, cpfConsumidor: 'private' }], [], '1')).toEqual({ sales: [{ id: 'coupon:C1:1', documentId: 'C1', productId: '5', storeId: '1', date: '2026-10-15', quantity: 10, kind: 'sale', cancelled: false, originalSaleId: null }, { id: 'coupon:C1:2', documentId: 'C1', productId: '6', storeId: '1', date: '2026-10-15', quantity: 2, kind: 'sale', cancelled: true, originalSaleId: null }], historyFrom: null, issues: ['SALES_HISTORY_COVERAGE_UNCONFIRMED', 'RETURNS_RECONCILIATION_UNCONFIRMED'] })
  })
  it('deduplicates identical source items and rejects conflicts instead of double counting', () => {
    expect(mapSales([coupon, coupon], [], '1').sales).toHaveLength(2)
    const conflict = { ...coupon, itensVenda: [{ id: 1, produtoId: 5, quantidadeVenda: 11, tipo: '1' }] }
    expect(() => mapSales([coupon, conflict], [], '1')).toThrow('ERP_SALE_IDENTITY_CONFLICT')
  })
  it('preserves unknown return linkage as a blocking issue without fabricating net sales', () => {
    expect(mapSales([coupon], [{ id: 'R1', itensTroca: [{ produtoId: 5, quantidade: 2 }] }], '1').issues).toContain('RETURNS_RECONCILIATION_UNCONFIRMED')
  })
  it('rejects incomplete sale rows and filters other stores', () => {
    expect(() => mapSales([{ ...coupon, dataVenda: 'invalid' }], [], '1')).toThrow('ERP_SALE_FIELDS_INVALID')
    expect(mapSales([{ ...coupon, lojaId: 2 }], [], '1').sales).toEqual([])
    expect(mapSales([{ ...coupon, cancelada: true }], [], '1').sales.every(sale => sale.cancelled)).toBe(true)
  })
})
