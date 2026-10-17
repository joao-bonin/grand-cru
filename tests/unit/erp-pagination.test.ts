import { describe, expect, it, vi } from 'vitest'
import { paginateErp } from '../../server/infrastructure/erp/paginate'

describe('complete ERP pagination CV-02', () => {
  it('returns all pages preserving item identities', async () => {
    const get = vi.fn().mockResolvedValueOnce({ start: 0, count: 2, total: 3, items: [{ id: 1 }, { id: 2 }] }).mockResolvedValueOnce({ start: 2, count: 1, total: 3, items: [{ id: 3 }] })
    expect(await paginateErp({ get }, '/v1/produto/produtos')).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(get.mock.calls[1]?.[1]).toEqual({ start: 2, count: 100 })
  })
  it('accepts an explicitly complete empty collection', async () => {
    expect(await paginateErp({ get: vi.fn().mockResolvedValue({ start: 0, count: 0, total: 0, items: [] }) }, '/v1/produto/produtos')).toEqual([])
  })
  it('rejects the entire load on later failure', async () => {
    const get = vi.fn().mockResolvedValueOnce({ start: 0, count: 1, total: 2, items: [{ id: 1 }] }).mockRejectedValueOnce(new Error('ERP_HTTP_500'))
    await expect(paginateErp({ get }, '/v1/produto/produtos')).rejects.toThrow('ERP_HTTP_500')
  })
  it.each([
    { start: 1, count: 1, total: 2, items: [{ id: 1 }] },
    { start: 0, count: 2, total: 2, items: [{ id: 1 }] },
    { start: 0, count: 0, total: 2, items: [] },
    { start: 0, count: 1, total: 0, items: [{ id: 1 }] },
    { items: [] },
    { start: 0, count: 101, total: 101, items: Array.from({ length: 101 }, (_, id) => ({ id })) },
    { start: 0, count: 1, total: 1_000_001, items: [{ id: 1 }] },
    { start: 0, count: 1, total: Infinity, items: [{ id: 1 }] },
  ])('rejects inconsistent page %j', async (page) => {
    await expect(paginateErp({ get: vi.fn().mockResolvedValue(page) }, '/v1/produto/produtos')).rejects.toThrow('ERP_PAGINATION_INVALID')
  })
  it('rejects changing totals and repeated pages', async () => {
    for (const second of [{ start: 1, count: 1, total: 3, items: [{ id: 2 }] }, { start: 1, count: 1, total: 2, items: [{ id: 1 }] }]) {
      const get = vi.fn().mockResolvedValueOnce({ start: 0, count: 1, total: 2, items: [{ id: 1 }] }).mockResolvedValueOnce(second)
      await expect(paginateErp({ get }, '/v1/produto/produtos')).rejects.toThrow(/^ERP_PAGINATION_/)
    }
  })
})
