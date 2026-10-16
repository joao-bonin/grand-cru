<script setup lang="ts">
import { computed } from 'vue'
import type { PublicUser } from '../../shared/types/user'
import { userDirectorySummary } from '#shared/application/user-directory'
const props = defineProps<{ users: PublicUser[] }>()
const metrics = computed(() => {
  const summary = userDirectorySummary(props.users)
  return [
    { label: 'Usuários cadastrados', value: summary.total, caption: 'Sua equipe no Grand Cru', icon: 'i-lucide-users-round', tone: 'wine' },
    { label: 'Acessos ativos', value: summary.active, caption: 'Prontos para acessar', icon: 'i-lucide-user-check', tone: 'green' },
    { label: 'Acessos inativos', value: summary.inactive, caption: 'Acesso temporariamente suspenso', icon: 'i-lucide-user-round-minus', tone: 'sand' },
    { label: 'Administradores ativos', value: summary.administrators, caption: 'Responsáveis pela gestão', icon: 'i-lucide-shield-check', tone: 'wine' },
  ]
})
</script>

<template>
  <div class="user-metrics"><article v-for="metric in metrics" :key="metric.label" class="metric-card" :class="metric.tone"><div><p>{{ metric.label }}</p><span class="metric-icon"><UIcon :name="metric.icon" /></span></div><strong>{{ metric.value }}</strong><small>{{ metric.caption }}</small></article></div>
</template>
