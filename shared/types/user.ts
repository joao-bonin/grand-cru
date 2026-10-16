export type UserRole = 'admin' | 'user'

export interface PublicUser {
  id: string
  login: string
  active: boolean
  role: UserRole
  createdAt: string
  updatedAt: string
  lastAccessAt: string | null
}
