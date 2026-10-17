export interface ErpConfiguration {
  username: string
  password: string
  encryptionKey: string
  storeId: string
}

export function erpConfiguration(env: Record<string, string | undefined>): ErpConfiguration | null {
  const username = env.ERP_USERNAME
  const password = env.ERP_PASSWORD
  const encryptionKey = env.ERP_TOKEN_ENCRYPTION_KEY
  const storeId = env.ERP_STORE_ID
  if (!username?.trim() || !password?.trim() || !encryptionKey || !storeId || !/^\d+$/.test(storeId)) return null
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encryptionKey) || Buffer.from(encryptionKey, 'base64').length !== 32 || Buffer.from(encryptionKey, 'base64').toString('base64') !== encryptionKey) return null
  return { username, password, encryptionKey, storeId }
}
