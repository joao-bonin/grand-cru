import { describe, expect, it } from 'vitest'
import { erpConfiguration } from '../../server/infrastructure/erp/configuration'

const env = { ERP_USERNAME: 'synthetic-user', ERP_PASSWORD: 'synthetic-password', ERP_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'), ERP_STORE_ID: '1' }
describe('ES-04 configuration is private and fail closed', () => {
  it('requires credentials, store and a dedicated canonical 32-byte key', () => {
    expect(erpConfiguration(env)).toEqual({ username: 'synthetic-user', password: 'synthetic-password', encryptionKey: env.ERP_TOKEN_ENCRYPTION_KEY, storeId: '1' })
  })
  it.each(Object.keys(env))('disables authentication when %s is absent', key => {
    expect(erpConfiguration({ ...env, [key]: '' })).toBeNull()
  })
  it.each(['ERP_USERNAME', 'ERP_PASSWORD'])('treats whitespace-only %s as missing', key => {
    expect(erpConfiguration({ ...env, [key]: '  ' })).toBeNull()
  })
  it.each(['invalid', Buffer.alloc(31).toString('base64'), Buffer.alloc(33).toString('base64'), ' '.repeat(44)])('rejects an invalid key before any session operation', key => {
    expect(erpConfiguration({ ...env, ERP_TOKEN_ENCRYPTION_KEY: key })).toBeNull()
  })
  it('rejects an invalid store and does not use a legacy static access token', () => {
    expect(erpConfiguration({ ...env, ERP_STORE_ID: '1/../../auth' })).toBeNull()
    expect(erpConfiguration({ ERP_ACCESS_TOKEN: 'synthetic', ERP_STORE_ID: '1' })).toBeNull()
  })
})
