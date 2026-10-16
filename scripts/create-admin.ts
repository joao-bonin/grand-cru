import { createUserRepository } from '../server/db/repository'
import { createUserInput } from '../server/services/auth'
import { hashPassword } from '../server/services/passwords'

if (!process.env.NUXT_DATABASE_URL) throw new Error('Configure NUXT_DATABASE_URL.')
const input = createUserInput.parse({ login: process.env.GRAND_CRU_ADMIN_LOGIN, password: process.env.GRAND_CRU_ADMIN_PASSWORD, role: 'admin', active: true })
const repository = createUserRepository(process.env.NUXT_DATABASE_URL)
try {
  if (await repository.findByLogin(input.login)) throw new Error('Este login já existe; nenhuma conta foi alterada.')
  await repository.create({ login: input.login, passwordHash: await hashPassword(input.password), role: 'admin', active: true })
  console.log('Administrador criado. Nenhuma credencial foi exibida.')
} finally { await repository.close() }
