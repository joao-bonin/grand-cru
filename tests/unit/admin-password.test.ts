import { describe, expect, it, vi } from 'vitest'
import { resetAdministratorPassword } from '../../server/services/admin-password'
import type { UserRecord } from '../../server/services/auth'

const admin = { id: 'admin-id', login: 'admin', passwordHash: 'old', role: 'admin', active: true, deletedAt: null } as UserRecord
function dependencies(user: UserRecord | undefined = admin) {
  return {
    findByLogin: vi.fn().mockResolvedValue(user),
    update: vi.fn().mockResolvedValue(user),
    hashPassword: vi.fn().mockResolvedValue('new-hash'),
    verifyPassword: vi.fn().mockResolvedValue(true),
  }
}
const input = { login: ' ADMIN ', password: 'new-password-long-enough' }

describe('recuperação do administrador', () => {
  it('altera somente a senha e confirma o hash persistido', async () => {
    const deps = dependencies()
    deps.findByLogin.mockResolvedValueOnce(admin).mockResolvedValueOnce({ ...admin, passwordHash: 'new-hash' })
    await resetAdministratorPassword(input, deps)
    expect(deps.findByLogin).toHaveBeenCalledWith('admin')
    expect(deps.update).toHaveBeenCalledWith(admin.id, { passwordHash: 'new-hash' })
    expect(deps.verifyPassword).toHaveBeenCalledWith('new-hash', input.password)
  })
  it.each([undefined, { ...admin, active: false }, { ...admin, role: 'user' }, { ...admin, deletedAt: new Date() }])('não cria nem reativa contas: %j', async user => {
    const deps = dependencies(); deps.findByLogin.mockResolvedValue(user)
    await expect(resetAdministratorPassword(input, deps)).rejects.toThrow('administrador ativo')
    expect(deps.update).not.toHaveBeenCalled()
    expect(deps.hashPassword).not.toHaveBeenCalled()
  })
  it('recusa senha curta antes de acessar o banco', async () => {
    const deps = dependencies()
    await expect(resetAdministratorPassword({ ...input, password: 'short' }, deps)).rejects.toThrow()
    expect(deps.findByLogin).not.toHaveBeenCalled()
  })
  it('não declara sucesso se a senha persistida não corresponder', async () => {
    const deps = dependencies(); deps.verifyPassword.mockResolvedValue(false)
    await expect(resetAdministratorPassword(input, deps)).rejects.toThrow('confirmar')
  })
})
