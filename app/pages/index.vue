<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
const { user, logout } = useAuth()
const { data, error, refresh } = await useFetch<{ users: import('../../shared/types/user').PublicUser[] }>('/api/users', { immediate: user.value?.role === 'admin' })
</script>

<template>
  <AppShell :user="user" active="overview" @logout="logout">
    <section class="dashboard-card member-welcome"><p class="admin-kicker">ESTOQUE E COMPRAS</p><h2>Seu dashboard de negócio</h2><p>Acompanhe prioridades de reposição, cobertura e pendências por produto e loja.</p><NuxtLink to="/dashboard" class="text-link">Abrir dashboard →</NuxtLink></section>
    <template v-if="user?.role === 'admin'">
      <div v-if="error" class="dashboard-card"><UAlert color="error" title="Não foi possível carregar os usuários." role="alert" /><UButton color="neutral" variant="outline" @click="refresh()">Tentar novamente</UButton></div>
      <AdminOverview v-else :users="data?.users ?? []" />
    </template>
    <section v-else class="member-welcome dashboard-card"><p class="admin-kicker">BEM-VINDO AO GRAND CRU</p><h1>Seu espaço de gestão</h1><p>Consulte o dashboard para acompanhar o estoque ou abra Reposição para revisar as sugestões de compra.</p><NuxtLink to="/replenishment" class="text-link">Abrir reposição →</NuxtLink></section>
  </AppShell>
</template>
