<script setup lang="ts">
import { computed } from 'vue'
import type { PublicUser } from '../../shared/types/user'
import { userDirectorySummary } from '#shared/application/user-directory'
const props = defineProps<{ users: PublicUser[], pending?: boolean, error?: string }>()
defineEmits<{ retry: [] }>()
const summary = computed(() => userDirectorySummary(props.users))
</script>

<template>
  <section class="dashboard-card operation-team" aria-labelledby="dashboard-team-heading" :aria-busy="pending || undefined">
    <div class="operation-team-intro"><span class="operation-team-icon"><UIcon name="i-lucide-users-round" /></span><div><p class="card-kicker">PESSOAS E ACESSOS</p><h2 id="dashboard-team-heading">Sua equipe</h2><p v-if="error" role="alert">{{ error }}</p><p v-else-if="pending" role="status">Carregando os acessos da equipe…</p><p v-else>{{ summary.active }} {{ summary.active === 1 ? 'acesso ativo' : 'acessos ativos' }} · {{ summary.total }} {{ summary.total === 1 ? 'usuário cadastrado' : 'usuários cadastrados' }}</p></div></div>
    <div class="operation-team-actions"><button v-if="error" type="button" class="operation-text-button" @click="$emit('retry')">Tentar novamente</button><NuxtLink to="/users" class="text-link">Gerenciar usuários</NuxtLink><NuxtLink to="/users?novo=1" class="operation-button">Novo usuário</NuxtLink></div>
  </section>
</template>
