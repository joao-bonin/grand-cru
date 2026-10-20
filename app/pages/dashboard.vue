<script setup lang="ts">
import type { BusinessDashboardReport } from '../../shared/types/dashboard'
import '../assets/css/business-dashboard.css'
definePageMeta({ middleware: ['auth'] })
const { user, logout } = useAuth()
const { data, error, status, refresh } = await useFetch<BusinessDashboardReport>('/api/dashboard')
</script>

<template>
  <AppShell :user="user" active="dashboard" @logout="logout">
    <section v-if="error" class="business-panel business-empty" role="alert"><h1>Não foi possível carregar o dashboard</h1><p>Tente novamente para consultar os indicadores da última versão salva.</p><UButton @click="refresh()">Tentar novamente</UButton></section>
    <section v-else-if="status === 'pending' || !data" class="business-panel business-empty" role="status" aria-busy="true"><h1>Carregando dashboard</h1><p>Consultando estoque e políticas de reposição.</p></section>
    <BusinessDashboard v-else :report="data" />
  </AppShell>
</template>
