import type { ErpSessionProvider } from '../../application/erp/session-contracts'
import { assertErpReadRequest, createErpReadClient } from './read-client'
import type { ErpReadClient } from './read-client'

export function createAuthenticatedErpReadClient(options: { sessions: ErpSessionProvider, fetch?: typeof globalThis.fetch }): ErpReadClient {
  return {
    async get(path, query = {}) {
      assertErpReadRequest(path, query)
      const session = await options.sessions.getSession()
      try { return await createErpReadClient({ token: session.accessToken, fetch: options.fetch }).get(path, query) }
      catch (error) {
        if (!(error instanceof Error) || error.message !== 'ERP_AUTHENTICATION_PENDING') throw error
      }
      const renewed = await options.sessions.getSession(session.version)
      return createErpReadClient({ token: renewed.accessToken, fetch: options.fetch }).get(path, query)
    },
  }
}
