import { createUserRepository } from '../server/db/repository'
import { resetAdministratorPassword } from '../server/services/admin-password'
import { hashPassword, verifyPassword } from '../server/services/passwords'

if (!process.env.NUXT_DATABASE_URL) throw new Error('Configure NUXT_DATABASE_URL.')
const repository = createUserRepository(process.env.NUXT_DATABASE_URL)
try {
  await resetAdministratorPassword({
    login: process.env.GRAND_CRU_ADMIN_LOGIN,
    password: process.env.GRAND_CRU_ADMIN_PASSWORD,
  }, { ...repository, hashPassword, verifyPassword })
  console.log('Senha do administrador atualizada e verificada. Sessões anteriores revogadas. Nenhuma credencial foi exibida.')
} finally { await repository.close() }
