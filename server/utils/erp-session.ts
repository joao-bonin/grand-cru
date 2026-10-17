import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { AuthError } from '../services/auth'
import { createErpSessionProvider } from '../application/erp/session-provider'
import { createErpAuthenticationClient } from '../infrastructure/erp/auth-client'
import { createTokenCipher } from '../infrastructure/erp/token-cipher'
import { erpConfiguration } from '../infrastructure/erp/configuration'
import { createAuthenticatedErpReadClient } from '../infrastructure/erp/session-read-client'
import { createErpSessionStore } from '../infrastructure/persistence/erp-session-store'
import { purchasingPool } from './purchasing'

export function erpReadContext(event: H3Event) {
  const config = erpConfiguration(process.env)
  if (!config) throw new AuthError(503, 'Configure usuário, senha, chave de cifra e loja do ERP no servidor.')
  const identity = `varejofacil:${createHash('sha256').update(config.username).digest('hex')}`
  const store = createErpSessionStore(purchasingPool(event), { identity, cipher: createTokenCipher(config.encryptionKey) })
  const authentication = createErpAuthenticationClient({ username: config.username, password: config.password })
  const sessions = createErpSessionProvider({ store, authentication })
  return { client: createAuthenticatedErpReadClient({ sessions }), storeId: config.storeId }
}
