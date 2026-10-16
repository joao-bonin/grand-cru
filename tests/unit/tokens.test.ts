import { randomBytes } from 'node:crypto'
import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { createTokenService } from '../../server/services/tokens'
import { hashPassword, verifyPassword } from '../../server/services/passwords'

const secret = randomBytes(48).toString('hex')
const service = createTokenService(secret)
describe('JWT', () => {
  it('assina e verifica identidade e versão da sessão', async () => {
    expect(await service.verifyToken(await service.issueToken({ id: 'user-id', tokenVersion: 3 }))).toEqual({ id: 'user-id', version: 3 })
  })
  it('recusa chaves curtas', () => { expect(() => createTokenService('short')).toThrow() })
  it('recusa assinatura de outra chave', async () => {
    const token = await createTokenService(randomBytes(48).toString('hex')).issueToken({ id: 'user', tokenVersion: 0 })
    await expect(service.verifyToken(token)).rejects.toThrow()
  })
  it('recusa token expirado', async () => {
    const token = await new SignJWT({ ver: 0 }).setProtectedHeader({ alg: 'HS256' }).setSubject('user').setIssuer('grand-cru').setAudience('grand-cru-app').setIssuedAt().setExpirationTime(new Date('2000-01-01')).sign(new TextEncoder().encode(secret))
    await expect(service.verifyToken(token)).rejects.toThrow()
  })
  it('recusa audiência incorreta e ausência de versão', async () => {
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('user').setIssuer('grand-cru').setAudience('other').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret))
    await expect(service.verifyToken(token)).rejects.toThrow()
  })
})
describe('Senhas', () => {
  it('usa Argon2id, verifica a senha correta e recusa uma diferente', async () => {
    const encoded = await hashPassword('password-for-unit-test')
    expect(encoded).toMatch(/^\$argon2id\$/)
    expect(encoded).not.toContain('password-for-unit-test')
    expect(await verifyPassword(encoded, 'password-for-unit-test')).toBe(true)
    expect(await verifyPassword(encoded, 'wrong-password')).toBe(false)
  })
})
