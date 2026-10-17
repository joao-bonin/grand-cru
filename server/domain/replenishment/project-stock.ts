import type { OpenPurchase } from '../../../shared/types/replenishment'
import { civilDay, dayLabel } from './dates'

/** Receipts never retroactively remove an earlier shortage. Quantities are base units. */
export function projectStock(available: number, dailyDemand: number, purchases: OpenPurchase[], productId: string, storeId: string, horizonDays: number, now: Date) {
  const today = civilDay(now)
  if (today === null || ![available, dailyDemand, horizonDays].every(Number.isFinite) || dailyDemand < 0 || !Number.isSafeInteger(horizonDays) || horizonDays < 0) throw new Error('Projeção inválida')
  const issues: string[] = []
  const arrivals: { day: number, quantity: number }[] = []
  const unique = new Map<string, OpenPurchase>()
  for (const purchase of purchases.filter(item => item.productId === productId && item.storeId === storeId)) {
    const previous = unique.get(purchase.id)
    if (previous && (previous.quantity !== purchase.quantity || previous.received !== purchase.received || previous.cancelled !== purchase.cancelled || previous.arrival !== purchase.arrival || previous.status !== purchase.status)) issues.push('Identidade de compra com dados conflitantes')
    unique.set(purchase.id, purchase)
  }
  for (const purchase of unique.values()) {
    const status = purchase.status.toLowerCase()
    if (['draft', 'closed', 'cancelled', 'canceled', 'received'].includes(status)) continue
    if (!['open', 'pending', 'partial', 'partially_received', 'approved'].includes(status)) { issues.push('Estado de compra não comprovado'); continue }
    if (![purchase.quantity, purchase.received, purchase.cancelled].every(value => Number.isFinite(value) && value >= 0) || purchase.received + purchase.cancelled > purchase.quantity) {
      issues.push('Quantidades de compra inconsistentes')
      continue
    }
    const outstanding = purchase.quantity - purchase.received - purchase.cancelled
    if (outstanding === 0) continue
    const day = purchase.arrival === null ? null : civilDay(purchase.arrival)
    if (day === null || day < today) { issues.push('Chegada de compra não comprovada'); continue }
    if (day <= today + horizonDays) arrivals.push({ day, quantity: outstanding })
  }
  arrivals.sort((a, b) => a.day - b.day)
  let balance = available
  let offset = 0
  let ruptureDate: string | null = balance < 0 ? dayLabel(today) : null
  const consumeUntil = (next: number) => {
    const elapsed = next - offset
    if (ruptureDate === null && dailyDemand > 0 && balance - dailyDemand * elapsed < 0) {
      ruptureDate = dayLabel(today + offset + Math.floor(balance / dailyDemand) + 1)
    }
    balance -= dailyDemand * elapsed
    offset = next
  }
  for (const arrival of arrivals) {
    // A dated receipt is available before demand on its arrival day.
    consumeUntil(Math.max(0, arrival.day - today - 1))
    balance += arrival.quantity
  }
  consumeUntil(horizonDays)
  const pending = arrivals.reduce((sum, item) => sum + item.quantity, 0)
  if (!Number.isFinite(balance) || !Number.isFinite(pending)) issues.push('Projeção excede a precisão numérica')
  return { pending: Number.isFinite(pending) ? pending : 0, ruptureDate, issues: [...new Set(issues)] }
}
