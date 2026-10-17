import type { ErpReadClient } from './read-client'

/** A rejected page rejects the complete promise, so callers cannot publish a partial collection. */
export async function paginateErp(client: ErpReadClient, path: string): Promise<unknown[]> {
  const items: unknown[] = []
  const pages = new Set<string>()
  let total: number | null = null
  for (let pageNumber = 0; pageNumber < 10_000; pageNumber++) {
    const response = await client.get(path, { start: items.length, count: 100 })
    if (!response || typeof response !== 'object') throw new Error('ERP_PAGINATION_INVALID')
    const page = response as Record<string, unknown>
    if (!Array.isArray(page.items) || !Number.isSafeInteger(page.start) || !Number.isSafeInteger(page.count) || !Number.isSafeInteger(page.total)) throw new Error('ERP_PAGINATION_INVALID')
    const count = page.count as number
    const reportedTotal = page.total as number
    if (page.start !== items.length || count !== page.items.length || count < 0 || count > 100 || reportedTotal > 1_000_000 || reportedTotal < items.length + count || (total !== null && total !== reportedTotal)) throw new Error('ERP_PAGINATION_INVALID')
    total = reportedTotal
    if (count === 0 && items.length !== total) throw new Error('ERP_PAGINATION_INVALID')
    const signature = JSON.stringify(page.items)
    if (pages.has(signature)) throw new Error('ERP_PAGINATION_REPEATED')
    pages.add(signature)
    items.push(...page.items)
    if (items.length === total) return items
  }
  throw new Error('ERP_PAGINATION_LIMIT')
}
