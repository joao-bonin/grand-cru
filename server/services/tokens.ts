import { jwtVerify, SignJWT } from 'jose'
import type { UserRecord } from './auth'

export const SESSION_SECONDS = 3600
const ISSUER = 'grand-cru'
const AUDIENCE = 'grand-cru-app'

export function createTokenService(secret: string) {
  const key = new TextEncoder().encode(secret)
  if (key.length < 32) throw new Error('Configure uma chave JWT com pelo menos 32 bytes.')
  return {
    async issueToken(user: Pick<UserRecord, 'id' | 'tokenVersion'>) {
      return new SignJWT({ ver: user.tokenVersion })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(user.id).setIssuer(ISSUER).setAudience(AUDIENCE)
        .setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`).sign(key)
    },
    async verifyToken(token: string) {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE, requiredClaims: ['sub', 'iat', 'exp', 'ver'],
      })
      if (!payload.sub || !Number.isInteger(payload.ver) || Number(payload.ver) < 0) throw new Error('Token inválido.')
      return { id: payload.sub, version: payload.ver as number }
    },
  }
}
