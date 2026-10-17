export interface ErpTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date | null
}

export interface ErpSession extends ErpTokens {
  version: number
  renewedAt: Date
}

export interface ErpAuthenticationClient {
  login: () => Promise<ErpTokens>
  refresh: (refreshToken: string) => Promise<ErpTokens>
}

export interface ErpSessionStore {
  withSession: <T>(operation: (session: ErpSession | null, save: (tokens: ErpTokens) => Promise<ErpSession>) => Promise<T>) => Promise<T>
}

export interface ErpSessionProvider {
  getSession: (rejectedVersion?: number) => Promise<ErpSession>
}
