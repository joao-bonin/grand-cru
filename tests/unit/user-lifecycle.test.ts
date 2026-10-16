import { describe, expect, it } from 'vitest'
import { assertAdministratorRemains, LastAdministratorError } from '../../server/domain/identity/user-lifecycle'

describe('Preservação do último administrador ativo', () => {
  const admin = { active: true, role: 'admin' as const }
  it('impede inativação ou exclusão do único administrador', () => {
    expect(() => assertAdministratorRemains(admin, { ...admin, active: false }, 1)).toThrow(LastAdministratorError)
  })
  it('impede rebaixamento do único administrador', () => {
    expect(() => assertAdministratorRemains(admin, { active: true, role: 'user' }, 1)).toThrow(LastAdministratorError)
  })
  it('permite remover um administrador quando outro continua ativo', () => {
    expect(() => assertAdministratorRemains(admin, { ...admin, active: false }, 2)).not.toThrow()
  })
  it('permite inativar um usuário comum', () => {
    expect(() => assertAdministratorRemains({ active: true, role: 'user' }, { active: false, role: 'user' }, 1)).not.toThrow()
  })
  it('permite editar o administrador sem retirar seu acesso', () => {
    expect(() => assertAdministratorRemains(admin, admin, 1)).not.toThrow()
  })
})
