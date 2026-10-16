import { describe, expect, it, vi } from 'vitest'
import { AuthError, createAuthService, createUserInput, publicUser, requireAdmin, updateUserInput } from '../../server/services/auth'
import type { UserRecord } from '../../server/services/auth'

const fixture = (): UserRecord => ({ id: 'test-user', login: 'joao', passwordHash: 'secret-hash', active: true, role: 'user', tokenVersion: 0, createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-01T00:00:00Z'), lastAccessAt: null, deletedAt: null })
function context(user: UserRecord | undefined = fixture()) {
  const repository = { findByLogin: vi.fn().mockResolvedValue(user), findById: vi.fn().mockResolvedValue(user), markAccess: vi.fn(), revoke: vi.fn() }
  const verifyPassword = vi.fn().mockResolvedValue(true)
  const issueToken = vi.fn().mockResolvedValue('test-token')
  const verifyToken = vi.fn().mockResolvedValue({ id: 'test-user', version: 0 })
  const dummyPasswordHash = vi.fn().mockResolvedValue('dummy-hash')
  const service = createAuthService({ repository, verifyPassword, issueToken, verifyToken, dummyPasswordHash, now: () => new Date('2026-02-01T00:00:00Z') })
  return { repository, service, verifyPassword, issueToken, verifyToken, dummyPasswordHash }
}

describe('Autenticação', () => {
  it('normaliza login, atualiza último acesso e não expõe hash ou versão de sessão', async () => {
    const ctx = context()
    const result = await ctx.service.login({ login: ' JOAO ', password: 'correct-password' })
    expect(ctx.repository.findByLogin).toHaveBeenCalledWith('joao')
    expect(ctx.repository.markAccess).toHaveBeenCalledWith('test-user', new Date('2026-02-01T00:00:00Z'))
    expect(result.user.lastAccessAt).toBe('2026-02-01T00:00:00.000Z')
    expect(result.user).not.toHaveProperty('passwordHash')
    expect(result.user).not.toHaveProperty('tokenVersion')
    expect(result.token).toBe('test-token')
  })
  it('recusa senha inválida sem registrar acesso ou emitir token', async () => {
    const ctx = context(); ctx.verifyPassword.mockResolvedValue(false)
    await expect(ctx.service.login({ login: 'joao', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 })
    expect(ctx.repository.markAccess).not.toHaveBeenCalled()
    expect(ctx.issueToken).not.toHaveBeenCalled()
  })
  it('recusa usuário inativo com a mesma mensagem de credenciais inválidas', async () => {
    const ctx = context({ ...fixture(), active: false })
    await expect(ctx.service.login({ login: 'joao', password: 'correct' })).rejects.toMatchObject({ statusCode: 401, message: 'Login ou senha inválidos.' })
  })
  it('faz verificação de hash mesmo quando o login não existe', async () => {
    const ctx = context(); ctx.repository.findByLogin.mockResolvedValue(undefined)
    await expect(ctx.service.login({ login: 'unknown', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 })
    expect(ctx.verifyPassword).toHaveBeenCalledWith('dummy-hash', 'wrong')
  })
  it.each([null, {}, { login: 'joao', password: '' }, { login: 'joao', password: 'a'.repeat(129) }, { login: 'joao', password: 'ok', role: 'admin' }])('recusa entrada inválida: %j', async input => {
    const ctx = context()
    await expect(ctx.service.login(input)).rejects.toMatchObject({ statusCode: 400 })
    expect(ctx.repository.findByLogin).not.toHaveBeenCalled()
  })
  it('recusa ausência de token', async () => {
    await expect(context().service.authenticate(undefined)).rejects.toMatchObject({ statusCode: 401 })
  })
  it('recusa assinatura inválida ou token expirado', async () => {
    const ctx = context(); ctx.verifyToken.mockRejectedValue(new Error('invalid'))
    await expect(ctx.service.authenticate('invalid')).rejects.toMatchObject({ statusCode: 401 })
    expect(ctx.repository.findById).not.toHaveBeenCalled()
  })
  it.each([{ ...fixture(), active: false }, { ...fixture(), tokenVersion: 1 }, { ...fixture(), deletedAt: new Date() }])('recusa sessão de usuário desativado, excluído ou revogada', async user => {
    await expect(context(user).service.authenticate('old-token')).rejects.toMatchObject({ statusCode: 401 })
  })
  it('recusa sessão de conta removida', async () => {
    const ctx = context(); ctx.repository.findById.mockResolvedValue(undefined)
    await expect(ctx.service.authenticate('token')).rejects.toMatchObject({ statusCode: 401 })
  })
  it('aceita token válido com versão e usuário ativos', async () => {
    const user = fixture()
    expect(await context(user).service.authenticate('token')).toEqual(user)
  })
  it('revoga sessões no logout', async () => {
    const ctx = context()
    await ctx.service.logout(fixture())
    expect(ctx.repository.revoke).toHaveBeenCalledWith('test-user')
  })
})

describe('Usuários e autorização', () => {
  it('recusa acesso de usuário comum à administração', () => {
    expect(() => requireAdmin(fixture())).toThrow(AuthError)
    try { requireAdmin(fixture()) } catch (error) { expect(error).toMatchObject({ statusCode: 403 }) }
  })
  it('permite acesso do administrador', () => {
    expect(() => requireAdmin({ ...fixture(), role: 'admin' })).not.toThrow()
  })
  it('exige senha de pelo menos 12 caracteres na criação', () => {
    expect(createUserInput.safeParse({ login: 'new-user', password: 'short' }).success).toBe(false)
    expect(createUserInput.parse({ login: ' NEW-USER ', password: 'long-password-123' })).toMatchObject({ login: 'new-user', role: 'user', active: true })
  })
  it('recusa atualizações vazias e campos de controle internos', () => {
    expect(updateUserInput.safeParse({}).success).toBe(false)
    expect(updateUserInput.safeParse({ tokenVersion: 0 }).success).toBe(false)
    expect(updateUserInput.safeParse({ passwordHash: 'injected' }).success).toBe(false)
  })
  it('permite atualização parcial sem exigir nova senha', () => {
    expect(updateUserInput.parse({ active: false })).toEqual({ active: false })
  })
  it('serializa datas e último acesso ausente sem expor credenciais', () => {
    expect(publicUser(fixture())).toEqual({ id: 'test-user', login: 'joao', active: true, role: 'user', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', lastAccessAt: null })
  })
})
