<script setup lang="ts">
import { computed } from 'vue'
import type { PublicUser } from '../../shared/types/user'
const props = defineProps<{ users: PublicUser[] }>()
const recentUsers = computed(() => [...props.users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5))
</script>

<template>
  <section>
    <header class="admin-page-heading"><div><p class="admin-kicker">SEU NEGÓCIO, EM PERSPECTIVA</p><h1>Sua equipe, <em>em sintonia.</em></h1><p>Um lugar para organizar quem faz o seu negócio acontecer.</p></div><UButton to="/users?novo=1" size="lg" class="wine-button"><UIcon name="i-lucide-plus" />Novo usuário</UButton></header>
    <UserMetrics :users="users" />
    <div class="overview-grid">
      <section class="dashboard-card team-card" aria-labelledby="team-heading"><header><div><p class="card-kicker">PESSOAS E ACESSOS</p><h2 id="team-heading">Quem cuida da sua operação</h2></div><NuxtLink to="/users" class="text-link">Gerenciar usuários <span aria-hidden="true">↗</span></NuxtLink></header><UserDirectory :users="recentUsers" /><div class="team-card-footer"><span>Cadastros mais recentes</span><span>Acessos controlados por perfil</span></div></section>
      <aside class="next-chapter"><span class="next-chapter-icon"><UIcon name="i-lucide-wine" /></span><span class="chapter-label">O PRÓXIMO CAPÍTULO</span><h2>Da sua equipe<br>à sua adega.</h2><p>Estoque, compras e a visão do seu negócio em um só lugar.</p><div><span><UIcon name="i-lucide-package" />Reposição com clareza</span><span><UIcon name="i-lucide-chart-no-axes-combined" />Loja e B2B separados</span><span><UIcon name="i-lucide-wallet" />Projeção de caixa</span></div><small>Disponíveis após as próximas integrações.</small></aside>
    </div>
    <section class="access-tip"><span><UIcon name="i-lucide-shield-check" /></span><div><h2>Cada pessoa, com o acesso certo.</h2><p>Administradores gerenciam contas. Usuários acessam as funcionalidades liberadas para a equipe.</p></div><NuxtLink to="/users" class="text-link">Revisar acessos →</NuxtLink></section>
  </section>
</template>
