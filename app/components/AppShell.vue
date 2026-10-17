<script setup lang="ts">
import type { PublicUser } from '../../shared/types/user'
defineProps<{ user: PublicUser | null, active: 'overview' | 'users' | 'replenishment' | 'purchase-drafts' }>()
defineEmits<{ logout: [] }>()
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <NuxtLink to="/" class="admin-brand"><span class="brand-mark" aria-hidden="true">G.</span><span>GRAND CRU<small>GESTÃO COM CLAREZA</small></span></NuxtLink>
      <span class="sidebar-label">SEU ESPAÇO</span>
      <nav aria-label="Navegação principal">
        <NuxtLink to="/" :class="{ selected: active === 'overview' }" :aria-current="active === 'overview' ? 'page' : undefined"><UIcon name="i-lucide-layout-dashboard" />Visão geral</NuxtLink>
        <NuxtLink to="/replenishment" :class="{ selected: active === 'replenishment' }" :aria-current="active === 'replenishment' ? 'page' : undefined"><UIcon name="i-lucide-wine" />Reposição</NuxtLink>
        <NuxtLink to="/purchase-drafts" :class="{ selected: active === 'purchase-drafts' }" :aria-current="active === 'purchase-drafts' ? 'page' : undefined"><UIcon name="i-lucide-clipboard-list" />Rodadas locais</NuxtLink>
        <NuxtLink v-if="user?.role === 'admin'" to="/users" :class="{ selected: active === 'users' }" :aria-current="active === 'users' ? 'page' : undefined"><UIcon name="i-lucide-users-round" />Usuários</NuxtLink>
      </nav>
      <div class="sidebar-roadmap"><span class="sidebar-label">EM BREVE</span><span><UIcon name="i-lucide-wallet" />Fluxo de caixa</span><span><UIcon name="i-lucide-handshake" />Relacionamento B2B</span></div>
      <div class="sidebar-note"><span aria-hidden="true">✦</span><p>Mais clareza.<br>Melhores decisões.</p><small>Um novo olhar sobre o seu negócio.</small></div>
      <div class="sidebar-account"><span class="account-avatar">{{ user?.login.slice(0, 1).toUpperCase() ?? 'G' }}</span><div><strong>{{ user?.login ?? 'Grand Cru' }}</strong><small>{{ user?.role === 'admin' ? 'Administrador' : 'Usuário' }}</small></div></div>
    </aside>
    <div class="admin-workspace">
      <header class="admin-topbar"><span>Grand Cru <span aria-hidden="true">/</span> {{ { overview: 'Visão geral', users: 'Usuários', replenishment: 'Reposição', 'purchase-drafts': 'Rodadas locais' }[active] }}</span><div><span class="connection-status"><span />Acesso protegido</span><UButton color="neutral" variant="ghost" size="sm" @click="$emit('logout')">Sair</UButton></div></header>
      <main class="admin-main"><slot /></main>
      <footer class="admin-footer">Grand Cru <span>•</span> Inteligência para o seu negócio</footer>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 1023px) {
  .admin-sidebar nav { flex-wrap: wrap; }
  .admin-sidebar nav a { flex-basis: calc(50% - .2rem); }
}
</style>
