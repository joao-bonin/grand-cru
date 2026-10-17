import type { Sale } from '../../../shared/types/replenishment'
import { civilDay } from './dates'

export function calculateNetDemand(sales: Sale[], productId: string, storeId: string, historyFrom: string | null, now: Date, windowDays: number) {
  const today = civilDay(now)
  if (!Number.isSafeInteger(windowDays) || windowDays <= 0) throw new Error('Janela inválida')
  if (today === null) throw new Error('Data de referência inválida')
  const from = historyFrom === null ? null : civilDay(historyFrom)
  const issues: string[] = []
  const unique = new Map<string, Sale>()
  for (const sale of sales.filter(item => item.productId === productId && item.storeId === storeId)) {
    const key = JSON.stringify([sale.kind, sale.id])
    const previous = unique.get(key)
    if (previous && !previous.cancelled && !sale.cancelled && (previous.quantity !== sale.quantity || previous.date !== sale.date || previous.originalSaleId !== sale.originalSaleId)) issues.push('Identidade de venda com dados conflitantes')
    // Cancellation supersedes another representation of the same item.
    if (!previous || sale.cancelled) unique.set(key, sale)
  }
  const entries: { day: number, quantity: number }[] = []
  const returned = new Map<string, number>()
  const originals = new Map([...unique.values()].filter(item => item.kind === 'sale').map(item => [item.id, item]))
  for (const item of unique.values()) {
    if (item.cancelled) continue
    const day = civilDay(item.date)
    if (day === null || !Number.isFinite(item.quantity) || item.quantity < 0) {
      issues.push('Vendas com data ou quantidade inválida')
      continue
    }
    if (item.kind === 'return') {
      const original = item.originalSaleId ? originals.get(item.originalSaleId) : null
      if (!original) { issues.push('Devolução sem venda original comprovada'); continue }
      if (original.cancelled) continue
      const totalReturned = (returned.get(original.id) ?? 0) + item.quantity
      returned.set(original.id, totalReturned)
      const originalDay = civilDay(original.date)
      if (totalReturned > original.quantity || originalDay === null || day < originalDay) issues.push('Devolução incompatível com a venda original')
    }
    entries.push({ day, quantity: item.kind === 'return' ? -item.quantity : item.quantity })
  }
  const windows: Record<string, { quantity: number, partial: boolean }> = {}
  for (const days of new Set([30, 60, 90, 365, windowDays])) {
    windows[String(days)] = {
      quantity: entries.filter(item => item.day >= today - days && item.day < today).reduce((sum, item) => sum + item.quantity, 0),
      partial: from === null || from > today - days,
    }
  }
  const selected = windows[String(windowDays)]!
  if (selected.partial) issues.push('Histórico insuficiente para a janela configurada')
  if (!Number.isFinite(selected.quantity)) issues.push('Consumo excede a precisão numérica')
  if (selected.quantity < 0) issues.push('Consumo líquido negativo exige conciliação')
  return { windows, dailyDemand: issues.length ? null : selected.quantity / windowDays, issues: [...new Set(issues)] }
}
