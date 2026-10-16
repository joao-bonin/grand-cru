import type { PublicUser, UserRole } from '../types/user'

export type UserStatusFilter = 'all' | 'active' | 'inactive'

export function userDirectorySummary(users: PublicUser[]) {
  return {
    total: users.length,
    active: users.filter(user => user.active).length,
    inactive: users.filter(user => !user.active).length,
    administrators: users.filter(user => user.role === 'admin' && user.active).length,
  }
}

export function filterUserDirectory(users: PublicUser[], search: string, status: UserStatusFilter = 'all', role: UserRole | 'all' = 'all') {
  const query = search.trim().toLowerCase()
  return users.filter(user => user.login.toLowerCase().includes(query)
    && (status === 'all' || user.active === (status === 'active'))
    && (role === 'all' || user.role === role))
}

export function formatAccessDate(date: string | null) {
  return date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date)) : 'Ainda não acessou'
}
