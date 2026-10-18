import type { ErpAuthenticationClient, ErpSessionProvider, ErpSessionStore } from './session-contracts'

export function createErpSessionProvider(options: { store: ErpSessionStore, authentication: ErpAuthenticationClient, now?: () => Date }): ErpSessionProvider {
  return {
    async getSession(rejectedVersion) {
      try {
        return await options.store.withSession(async (session, save) => {
          const now = options.now?.() ?? new Date()
          const expiresSoon = session?.expiresAt != null && session.expiresAt.getTime() <= now.getTime() + 30_000
          if (session && !expiresSoon && (rejectedVersion === undefined || session.version !== rejectedVersion)) return session
          if (session) {
            try { return await save(await options.authentication.refresh(session.refreshToken)) }
            catch (error) {
              if (!(error instanceof Error) || error.message !== 'ERP_AUTH_REJECTED') throw error
            }
          }
          return save(await options.authentication.login())
        })
      } catch (error) {
        // eslint-disable-next-line preserve-caught-error -- External authentication causes must not reach HTTP diagnostics.
        if (error instanceof Error && error.message === 'ERP_AUTH_REJECTED') throw new Error('ERP_AUTHENTICATION_PENDING')
        throw error
      }
    },
  }
}
