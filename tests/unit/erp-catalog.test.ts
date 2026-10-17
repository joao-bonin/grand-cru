import { describe, expect, it } from 'vitest'
import { mapCatalog } from '../../server/infrastructure/erp/catalog-mapper'

describe('catalog CV-03', () => {
  it('keeps homonyms separate and preserves documented purchasing fields', () => {
    const products = [1, 2].map(id => ({ id, descricao: 'Vinho', fornecedorId: 8, unidadeDeCompra: 'CX', itensEmbalagem: 6, custoMedio: 10, estoqueDoProduto: [{ lojaId: 1, estoqueMinimo: 4 }] }))
    expect(mapCatalog(products, [{ id: 8, nome: 'Fornecedor', prazoDeEntrega: 10 }], '1')).toEqual({ products: [1, 2].map(id => ({ id: String(id), description: 'Vinho', supplierId: '8', purchaseUnit: 'CX', packSize: 6, minimum: 4, cost: 10, storeId: '1' })), suppliers: [{ id: '8', name: 'Fornecedor', leadDays: 10 }], issues: [] })
  })
  it('preserves missing supplier/conversion as null and emits pending issues', () => {
    const result = mapCatalog([{ id: 'SKU-1', descricao: 'Vinho' }, { descricao: 'Vinho' }], [], '1')
    expect(result.products).toEqual([{ id: 'SKU-1', description: 'Vinho', supplierId: null, purchaseUnit: null, packSize: null, minimum: null, cost: null, storeId: '1' }])
    expect(result.issues).toEqual(['PRODUCT_PURCHASE_PARAMETERS_MISSING:SKU-1', 'PRODUCT_ID_OR_FIELDS_INVALID'])
  })
  it('never converts unsafe numeric identifiers to rounded strings', () => {
    expect(mapCatalog([{ id: Number.MAX_SAFE_INTEGER + 1, descricao: 'Vinho' }], [], '1').products).toEqual([])
  })
})
