<script setup lang="ts">
import type { OperationalDashboard } from '../../shared/types/dashboard'
import type { PublicUser } from '../../shared/types/user'
definePageMeta({ middleware: ['auth'] })
const { user, logout } = useAuth()
const { data: dashboard, error: dashboardError, pending: dashboardPending, refresh: refreshDashboard } = await useFetch<OperationalDashboard>('/api/dashboard')
const { data: team, error: teamError, pending: teamPending, refresh: refreshTeam } = await useFetch<{ users: PublicUser[] }>('/api/users', { immediate: user.value?.role === 'admin' })
</script>

<template>
  <AppShell :user="user" active="overview" @logout="logout">
    <div class="operational-dashboard">
      <header class="admin-page-heading operation-heading"><div><p class="admin-kicker">DASHBOARD OPERACIONAL</p><h1>Sua operação, <em>em foco.</em></h1><p>Veja o que comprar, o que conferir e o que está em revisão.</p></div><NuxtLink to="/replenishment" class="operation-button operation-primary-button"><UIcon name="i-lucide-arrow-up-right" />Abrir sugestões de compra</NuxtLink></header>
      <OperationalDashboard :dashboard="dashboard ?? null" :pending="dashboardPending" :error="dashboardError ? 'Tente novamente para consultar os indicadores atuais.' : ''" @retry="refreshDashboard()" />
      <DashboardTeam v-if="user?.role === 'admin'" :users="team?.users ?? []" :pending="teamPending" :error="teamError ? 'Não foi possível consultar os acessos da equipe.' : ''" @retry="refreshTeam()" />
    </div>
  </AppShell>
</template>

<style src="../assets/css/operational-dashboard.css"></style>
