import type { PublicUser } from '../../shared/types/user'

export function useAuth() {
  const user = useState<PublicUser | null>('auth-user', () => null)
  const requestFetch = useRequestFetch()
  async function refresh() {
    try { user.value = (await requestFetch<{ user: PublicUser }>('/api/auth/me')).user }
    catch (error) {
      user.value = null
      throw error
    }
  }
  async function login(login: string, password: string) {
    user.value = (await $fetch<{ user: PublicUser }>('/api/auth/login', { method: 'POST', body: { login, password } })).user
  }
  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }
  return { user, refresh, login, logout }
}
