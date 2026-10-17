export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ERP_RECORD_INVALID')
  return value as Record<string, unknown>
}
export function id(value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && value.trim() && value.length <= 200) return value
  throw new Error('ERP_ID_INVALID')
}
export function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
export function date(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && Number.isFinite(Date.parse(value)) ? value : null
}
