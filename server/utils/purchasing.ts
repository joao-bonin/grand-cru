import { createError } from 'h3'
import type { H3Event } from 'h3'
import { createDatabasePool } from '../db/connection'
import { createPurchasingRepository } from '../infrastructure/persistence/erp-repository'
let repository: ReturnType<typeof createPurchasingRepository> | undefined
export function purchasingRepository(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (!config.databaseUrl) throw createError({ statusCode: 503, statusMessage: 'Banco de dados não configurado.' })
  repository ??= createPurchasingRepository(createDatabasePool(config.databaseUrl))
  return repository
}
