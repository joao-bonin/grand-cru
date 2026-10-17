import { describe, expect, it, vi } from 'vitest'
import { loadErpData } from '../../server/application/erp/synchronize'

describe('caso de uso de leitura do ERP', () => {
  it('obtém somente coleções documentadas e preserva lacunas', async () => {
    const get = vi.fn(async () => ({ start: 0, count: 0, total: 0, items: [] }))
    const data = await loadErpData({ get }, '1')
    expect(get.mock.calls).toHaveLength(6)
    expect(data.products).toEqual([])
    expect(data.historyFrom).toBeNull()
    expect(data.issues).toContain('SALES_HISTORY_COVERAGE_UNCONFIRMED')
    expect(data.issues).toContain('RETURNS_RECONCILIATION_UNCONFIRMED')
  })
  it('não devolve uma carga parcial quando uma fonte falha', async () => {
    const get = vi.fn().mockResolvedValueOnce({ start: 0, count: 0, total: 0, items: [] }).mockRejectedValue(new Error('ERP_AUTHENTICATION_PENDING'))
    await expect(loadErpData({ get }, '1')).rejects.toThrow('ERP_AUTHENTICATION_PENDING')
    expect(get).toHaveBeenCalledTimes(2)
  })
  it('interrompe novas páginas após limite total da execução', async () => {
    const get = vi.fn()
    const now = vi.fn().mockReturnValueOnce(0).mockReturnValue(180_001)
    await expect(loadErpData({ get }, '1', now)).rejects.toThrow('ERP_SYNC_DEADLINE')
    expect(get).not.toHaveBeenCalled()
  })
})
