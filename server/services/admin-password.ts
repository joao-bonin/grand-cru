import { createUserInput } from './auth'
import type { UserRecord } from './auth'

interface AdminPasswordDependencies {
  findByLogin: (login: string) => Promise<UserRecord | undefined>
  update: (id: string, data: { passwordHash: string }) => Promise<UserRecord>
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (hash: string, password: string) => Promise<boolean>
}

export async function resetAdministratorPassword(input: unknown, deps: AdminPasswordDependencies) {
  const parsed = createUserInput.parse(input)
  const user = await deps.findByLogin(parsed.login)
  if (!user || user.role !== 'admin' || !user.active || user.deletedAt) {
    throw new Error('O login deve identificar um administrador ativo existente.')
  }
  await deps.update(user.id, { passwordHash: await deps.hashPassword(parsed.password) })
  const updated = await deps.findByLogin(parsed.login)
  if (!updated || !await deps.verifyPassword(updated.passwordHash, parsed.password)) {
    throw new Error('Não foi possível confirmar a atualização da senha.')
  }
}
