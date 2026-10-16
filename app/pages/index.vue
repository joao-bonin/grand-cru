<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
const { user, logout } = useAuth()
const { data, error, refresh } = await useFetch<{ users: import('../../shared/types/user').PublicUser[] }>('/api/users', { immediate: user.value?.role === 'admin' })
</script>

<template>
  <AppShell :user="user" active="overview" @logout="logout">
    <template v-if="user?.role === 'admin'">
      <div v-if="error" class="dashboard-card"><UAlert color="error" title="Não foi possível carregar os usuários." role="alert" /><UButton color="neutral" variant="outline" @click="refresh()">Tentar novamente</UButton></div>
      <AdminOverview v-else :users="data?.users ?? []" />
    </template>
    <section v-else class="member-welcome dashboard-card"><p class="admin-kicker">BEM-VINDO AO GRAND CRU</p><h1>Seu espaço está pronto.</h1><p>Seu acesso está ativo. As funcionalidades de estoque, compras e gestão estarão aqui após as próximas integrações.</p><NuxtLink to="/hello-world" class="text-link">Abrir Hello World →</NuxtLink></section>
  </AppShell>
</template>
