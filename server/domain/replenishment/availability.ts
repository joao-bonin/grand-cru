import type { Stock } from '../../../shared/types/replenishment'

export function calculateAvailability(stocks: Stock[], productId: string, storeId: string): { available: number | null, issues: string[] } {
  const locations = new Map<string, Stock>()
  for (const stock of stocks.filter(item => item.productId === productId && item.storeId === storeId)) {
    const previous = locations.get(stock.locationId)
    if (previous && [previous.physical, previous.reserved, previous.blocked, previous.disjoint].some((value, index) => value !== [stock.physical, stock.reserved, stock.blocked, stock.disjoint][index])) return { available: null, issues: ['Saldo conflitante para o mesmo local'] }
    locations.set(stock.locationId, stock)
  }
  if (!locations.size) return { available: null, issues: ['Saldo não comprovado'] }
  let available = 0
  for (const stock of locations.values()) {
    if (stock.reserved === null || stock.blocked === null || !stock.disjoint || ![stock.physical, stock.reserved, stock.blocked].every(Number.isFinite) || stock.reserved < 0 || stock.blocked < 0) {
      return { available: null, issues: ['Relação entre reservas e bloqueios não comprovada'] }
    }
    available += stock.physical - stock.reserved - stock.blocked
  }
  return Number.isFinite(available) ? { available, issues: [] } : { available: null, issues: ['Saldo excede a precisão numérica'] }
}
