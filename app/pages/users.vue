<script setup lang="ts">
import type { PublicUser, UserRole } from '../../shared/types/user'
import { filterUserDirectory } from '#shared/application/user-directory'
import type { UserStatusFilter } from '#shared/application/user-directory'
definePageMeta({ middleware: ['auth', 'admin'] })
const auth = useAuth()
const { data, error: loadError, refresh } = await useFetch<{ users: PublicUser[] }>('/api/users')
const editing = ref<PublicUser>()
const editorOpen = ref(useRoute().query.novo === '1')
const pending = ref(false)
const error = ref('')
const success = ref('')
const search = ref('')
const status = ref<UserStatusFilter>('all')
const role = ref<UserRole | 'all'>('all')
const deleting = ref<PublicUser>()
const deleteOpen = ref(false)
const filteredUsers = computed(() => filterUserDirectory(data.value?.users ?? [], search.value, status.value, role.value))
function openEditor(user?: PublicUser) { editing.value = user; editorOpen.value = true; error.value = ''; success.value = '' }
async function save(body: { login: string, password?: string, role: UserRole, active: boolean }) {
  pending.value = true
  error.value = ''
  try {
    if (editing.value) await $fetch(`/api/users/${editing.value.id}`, { method: 'PATCH', body })
    else await $fetch('/api/users', { method: 'POST', body })
    if (editing.value?.id === auth.user.value?.id) {
      auth.user.value = null
      await navigateTo('/login')
      return
    }
    editorOpen.value = false
    await refresh()
    success.value = 'Usuário salvo. Alterações de conta encerram as sessões anteriores.'
  } catch (cause) {
    error.value = (cause as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível salvar o usuário.'
  } finally { pending.value = false }
}
async function toggle(user: PublicUser) {
  pending.value = true
  error.value = ''; success.value = ''
  try {
    await $fetch(`/api/users/${user.id}`, { method: 'PATCH', body: { active: !user.active } })
    if (user.id === auth.user.value?.id) { auth.user.value = null; await navigateTo('/login'); return }
    await refresh()
    success.value = user.active ? 'Usuário inativado. O acesso foi encerrado.' : 'Usuário ativado.'
  } catch (cause) { error.value = (cause as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível alterar o status.' }
  finally { pending.value = false }
}
function askRemove(user: PublicUser) { deleting.value = user; deleteOpen.value = true; error.value = ''; success.value = '' }
async function remove() {
  if (!deleting.value) return
  pending.value = true
  error.value = ''
  try {
    await $fetch(`/api/users/${deleting.value.id}`, { method: 'DELETE' })
    if (deleting.value.id === auth.user.value?.id) { auth.user.value = null; await navigateTo('/login'); return }
    deleteOpen.value = false
    await refresh()
    success.value = 'Usuário excluído. Suas sessões foram encerradas.'
  } catch (cause) { error.value = (cause as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Não foi possível excluir o usuário.' }
  finally { pending.value = false }
}
</script>

<template>
  <AppShell :user="auth.user.value" active="users" @logout="auth.logout">
    <NuxtLink to="/dashboard" class="text-link back-link">← Início</NuxtLink>
    <header class="admin-page-heading"><div><p class="admin-kicker">PESSOAS E ACESSOS</p><h1>Usuários</h1><p>Sua equipe, com o acesso certo para cada pessoa.</p></div><UButton size="lg" class="wine-button" @click="openEditor()"><UIcon name="i-lucide-plus" />Novo usuário</UButton></header>
    <UserMetrics :users="data?.users ?? []" />
    <UAlert v-if="success" color="success" :title="success" role="status" />
    <UAlert v-if="error && !editorOpen && !deleteOpen" color="error" :title="error" role="alert" />
    <section class="dashboard-card management-card" aria-labelledby="directory-heading">
      <header><div><h2 id="directory-heading">Todos os usuários</h2><p>{{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas' }}</p></div></header>
      <div class="directory-filters"><UInput v-model="search" icon="i-lucide-search" placeholder="Buscar por login…" aria-label="Buscar usuários" size="lg" /><USelect v-model="status" aria-label="Filtrar por status" :items="[{ label: 'Todos os status', value: 'all' }, { label: 'Ativos', value: 'active' }, { label: 'Inativos', value: 'inactive' }]" size="lg" /><USelect v-model="role" aria-label="Filtrar por perfil" :items="[{ label: 'Todos os perfis', value: 'all' }, { label: 'Administradores', value: 'admin' }, { label: 'Usuários', value: 'user' }]" size="lg" /></div>
      <div v-if="loadError" class="directory-empty"><UAlert color="error" title="Não foi possível carregar os usuários." role="alert" /><UButton @click="refresh()">Tentar novamente</UButton></div>
      <UserDirectory v-else :users="filteredUsers" actions :pending="pending" @edit="openEditor" @toggle="toggle" @remove="askRemove" />
    </section>
    <UModal v-model:open="editorOpen" :title="editing ? 'Editar usuário' : 'Novo usuário'" description="Defina o login, o perfil e o acesso desta pessoa." :dismissible="!pending" :ui="{ content: 'admin-dialog' }">
      <template #body><UserEditor :key="editing?.id ?? 'new'" :user="editing" :pending="pending" :error="error" @save="save" @cancel="editorOpen = false" /></template>
    </UModal>
    <UModal v-model:open="deleteOpen" title="Excluir usuário?" :description="`O acesso de ${deleting?.login ?? 'este usuário'} será encerrado e a conta sairá da lista.`" :dismissible="!pending">
      <template #body><UAlert v-if="error" color="error" :title="error" role="alert" /><p>Confira o login antes de confirmar. O último administrador ativo precisa permanecer na equipe.</p></template>
      <template #footer><UButton color="neutral" variant="outline" :disabled="pending" @click="deleteOpen = false">Cancelar</UButton><UButton color="error" :loading="pending" :disabled="pending" @click="remove">Confirmar exclusão</UButton></template>
    </UModal>
  </AppShell>
</template>
