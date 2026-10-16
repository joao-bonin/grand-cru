import type { UserRole } from '../../../shared/types/user'

export class LastAdministratorError extends Error {
  constructor() { super('Mantenha pelo menos um administrador ativo.') }
}

export function assertAdministratorRemains(current: { active: boolean, role: UserRole }, next: { active: boolean, role: UserRole }, activeAdministrators: number) {
  if (current.active && current.role === 'admin' && (!next.active || next.role !== 'admin') && activeAdministrators <= 1) {
    throw new LastAdministratorError()
  }
}
