const DAY = 86_400_000
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })

/** Calendar day number, independent of the server timezone. Invalid source dates stay unknown. */
export function civilDay(input: string | Date): number | null {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const time = Date.parse(`${input}T00:00:00Z`)
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== input) return null
    return time / DAY
  }
  // Timezone-less timestamps cannot be interpreted safely as ERP instants.
  if (typeof input === 'string' && (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input) || civilDay(input.slice(0, 10)) === null)) return null
  const date = input instanceof Date ? input : new Date(input)
  if (!Number.isFinite(date.getTime())) return null
  const parts = formatter.formatToParts(date)
  const value = (type: string) => parts.find(part => part.type === type)?.value
  return Date.parse(`${value('year')}-${value('month')}-${value('day')}T00:00:00Z`) / DAY
}

export function dayLabel(day: number): string {
  return new Date(day * DAY).toISOString().slice(0, 10)
}
