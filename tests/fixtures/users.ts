import type { PublicUser } from '../../shared/types/user'

export const sampleUsers: PublicUser[] = [
  { id: 'admin', login: 'ana', active: true, role: 'admin', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastAccessAt: '2026-01-02T00:00:00Z' },
  { id: 'member', login: 'comercial', active: true, role: 'user', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z', lastAccessAt: null },
  { id: 'inactive', login: 'financeiro', active: false, role: 'user', createdAt: '2026-01-04T00:00:00Z', updatedAt: '2026-01-04T00:00:00Z', lastAccessAt: null },
]

export const uiStubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  UButton: { props: ['to'], template: '<a v-if="to" :href="to"><slot /></a><button v-else><slot /></button>' },
  UIcon: { template: '<span aria-hidden="true" />' },
}
