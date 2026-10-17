import type { Policy } from '../../../shared/types/replenishment'

/** Explicit local configuration; never infer an unapproved purchasing policy. */
export function validatePolicy(input: unknown): Policy {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Política inválida')
  const value = input as Record<string, unknown>
  for (const field of ['productId', 'storeId', 'supplierId']) {
    if (typeof value[field] !== 'string' || !value[field].trim()) throw new Error(`Parâmetro obrigatório: ${field}`)
  }
  for (const field of ['windowDays', 'leadDays', 'reviewDays', 'safetyUnits', 'minimum', 'packSize', 'version']) {
    const number = value[field]
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) throw new Error(`Parâmetro inválido: ${field}`)
  }
  for (const field of ['windowDays', 'leadDays', 'reviewDays', 'packSize', 'version']) {
    if (!Number.isSafeInteger(value[field])) throw new Error(`Parâmetro inteiro obrigatório: ${field}`)
  }
  for (const field of ['windowDays', 'leadDays', 'reviewDays']) {
    if (Number(value[field]) > 3650) throw new Error(`Limite operacional de 3650 dias excedido: ${field}`)
  }
  if (Number(value.windowDays) <= 0 || Number(value.packSize) <= 0) throw new Error('Janela e embalagem devem ser positivas')
  if (value.cost !== null && (typeof value.cost !== 'number' || !Number.isFinite(value.cost) || value.cost < 0)) throw new Error('Custo inválido')
  return {
    productId: value.productId as string, storeId: value.storeId as string, supplierId: value.supplierId as string,
    windowDays: value.windowDays as number, leadDays: value.leadDays as number, reviewDays: value.reviewDays as number,
    safetyUnits: value.safetyUnits as number, minimum: value.minimum as number, packSize: value.packSize as number,
    cost: value.cost as number | null, version: value.version as number,
  }
}
