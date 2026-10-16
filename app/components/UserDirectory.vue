<script setup lang="ts">
import type { PublicUser } from '../../shared/types/user'
import { formatAccessDate } from '#shared/application/user-directory'
defineProps<{ users: PublicUser[], actions?: boolean, pending?: boolean }>()
defineEmits<{ edit: [user: PublicUser], toggle: [user: PublicUser], remove: [user: PublicUser] }>()
</script>

<template>
  <div class="directory-list">
    <div v-if="users.length" class="directory-heading" aria-hidden="true"><span>USUÁRIO</span><span>PERFIL</span><span>STATUS</span><span>ÚLTIMO ACESSO</span><span>{{ actions ? 'AÇÕES' : '' }}</span></div>
    <article v-for="user in users" :key="user.id" class="directory-row">
      <div class="directory-person"><span class="directory-avatar" :class="{ inactive: !user.active }">{{ user.login.slice(0, 1).toUpperCase() }}</span><div><h3>{{ user.login }}</h3><small>Criado em {{ formatAccessDate(user.createdAt) }}</small></div></div>
      <div class="directory-role"><span class="mobile-field">Perfil</span><span>{{ user.role === 'admin' ? 'Administrador' : 'Usuário' }}</span></div>
      <div><span class="mobile-field">Status</span><span class="status-pill" :class="user.active ? 'is-active' : 'is-inactive'"><span />{{ user.active ? 'Ativo' : 'Inativo' }}</span></div>
      <div class="directory-dates"><span class="mobile-field">Último acesso</span><span>{{ formatAccessDate(user.lastAccessAt) }}</span><small v-if="actions">Atualizado em {{ formatAccessDate(user.updatedAt) }}</small></div>
      <div v-if="actions" class="directory-actions"><UButton color="neutral" variant="ghost" size="sm" :disabled="pending" @click="$emit('edit', user)">Editar</UButton><UButton color="neutral" variant="ghost" size="sm" :disabled="pending" @click="$emit('toggle', user)">{{ user.active ? 'Inativar' : 'Ativar' }}</UButton><UButton color="error" variant="ghost" size="sm" :disabled="pending" @click="$emit('remove', user)">Excluir</UButton></div>
      <span v-else class="directory-check" aria-hidden="true"><UIcon name="i-lucide-chevron-right" /></span>
    </article>
    <div v-if="!users.length" class="directory-empty"><UIcon name="i-lucide-search" /><h3>Nenhum usuário encontrado</h3><p>Revise a busca ou os filtros para encontrar sua equipe.</p></div>
  </div>
</template>
