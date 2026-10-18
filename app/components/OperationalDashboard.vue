<script setup lang="ts">
import { computed } from 'vue'
import type { OperationalDashboard } from '../../shared/types/dashboard'

const props = defineProps<{ dashboard: OperationalDashboard | null, pending?: boolean, error?: string }>()
defineEmits<{ retry: [] }>()
const formatNumber = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('pt-BR')
const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
const formatRuptureDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
const formatUpdate = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const metrics = computed(() => {
  const products = props.dashboard?.products
  return [
    { key: 'ready', label: 'Prontos para comprar', value: products?.ready, caption: products ? 'Sugestão disponível, sem bloqueios' : 'Aguardando dados sincronizados', icon: 'i-lucide-shopping-basket', tone: 'wine' },
    { key: 'pending', label: 'Com pendências', value: products?.pending, caption: products ? 'Precisam de conferência para liberar' : 'Aguardando dados sincronizados', icon: 'i-lucide-circle-help', tone: 'sand' },
    { key: 'rupture', label: 'Com ruptura prevista', value: products?.rupture, caption: products ? `${formatNumber(products.unknownRisk)} com risco ainda não calculado` : 'Risco ainda não calculado', icon: 'i-lucide-triangle-alert', tone: 'sand' },
    { key: 'drafts', label: 'Rodadas em revisão', value: props.dashboard?.rounds.draft, caption: 'Rascunhos salvos no Grand Cru', icon: 'i-lucide-clipboard-list', tone: 'green' },
  ]
})
</script>

<template>
  <section class="operational-content" :aria-busy="pending || undefined" aria-label="Resumo operacional">
    <div v-if="error" class="operation-feedback operation-error" role="alert"><UIcon name="i-lucide-circle-alert" /><div><strong>Não foi possível carregar o dashboard.</strong><p>{{ error }}</p></div><button type="button" class="operation-button" @click="$emit('retry')">Tentar novamente</button></div>
    <p v-else-if="pending" class="operation-feedback" role="status">Carregando o resumo da operação…</p>
    <template v-else-if="dashboard">
      <div class="operation-source"><span><UIcon name="i-lucide-database" />{{ dashboard.snapshot ? `Dados de ${formatUpdate(dashboard.snapshot.createdAt)} · Brasília` : 'Nenhuma sincronização disponível' }}</span><button type="button" class="operation-text-button" @click="$emit('retry')"><UIcon name="i-lucide-refresh-cw" />Atualizar resumo</button></div>
      <p v-if="dashboard.synchronization === 'failed'" class="operation-feedback" role="status">A última sincronização falhou. {{ dashboard.snapshot ? 'Este resumo usa a última versão disponível. Confira a atualização na reposição.' : 'Abra a reposição para conferir a atualização dos dados.' }}</p>
      <p v-else-if="dashboard.synchronization === 'running'" class="operation-feedback" role="status">Sincronização em andamento. {{ dashboard.snapshot ? 'Os indicadores usam a versão anterior até a conclusão.' : 'Os indicadores estarão disponíveis após a conclusão.' }}</p>
      <div class="operation-metrics">
        <article v-for="metric in metrics" :key="metric.key" class="metric-card operation-metric" :class="metric.tone" :data-metric="metric.key"><div><p>{{ metric.label }}</p><span class="metric-icon"><UIcon :name="metric.icon" /></span></div><strong>{{ formatNumber(metric.value) }}</strong><small>{{ metric.caption }}</small></article>
      </div>
      <p class="operation-count-note">{{ dashboard.products ? `${formatNumber(dashboard.products.total)} combinações de produto e loja na base completa. Um produto em duas lojas conta duas vezes.` : 'Sem dados sincronizados, os indicadores de produtos ficam indisponíveis.' }}</p>
      <div class="operation-grid">
        <section class="dashboard-card operation-priorities" aria-labelledby="purchase-priorities-heading">
          <header><div><p class="card-kicker">SUA PRÓXIMA AÇÃO</p><h2 id="purchase-priorities-heading">Prioridades de compra</h2></div><NuxtLink to="/replenishment" class="text-link">Abrir reposição <span aria-hidden="true">↗</span></NuxtLink></header>
          <p v-if="dashboard.priorities.length" class="operation-section-intro">Sugestões prontas, com a ruptura mais próxima primeiro.</p>
          <ol v-if="dashboard.priorities.length" class="operation-priority-list">
            <li v-for="(item, index) in dashboard.priorities" :key="JSON.stringify([item.productId, item.storeId])"><span class="operation-rank" aria-hidden="true">{{ index + 1 }}</span><div class="operation-product"><h3>{{ item.description }}</h3><p>Loja {{ item.storeId }} · {{ item.supplier }}</p><span class="operation-risk" :class="{ 'has-risk': item.ruptureDate }">{{ item.ruptureDate ? `Ruptura prevista: ${formatRuptureDate(item.ruptureDate)}` : 'Sem ruptura prevista no horizonte' }}</span></div><div class="operation-quantity"><strong>{{ formatNumber(item.suggested) }}</strong><span>unidades sugeridas</span></div></li>
          </ol>
          <div v-else class="operation-empty"><span class="operation-empty-icon"><UIcon :name="dashboard.products?.pending ? 'i-lucide-list-checks' : 'i-lucide-wine'" /></span><h3>{{ !dashboard.snapshot ? 'Comece pelos dados da operação' : dashboard.products?.pending ? 'Há dados para conferir' : 'Nenhuma sugestão de compra disponível' }}</h3><p>{{ !dashboard.snapshot ? 'Abra a reposição para conferir a conexão e a sincronização do ERP.' : dashboard.products?.pending ? 'As pendências podem impedir o cálculo. Confira os motivos na reposição; isso não significa que o estoque está suficiente.' : 'Confira os produtos e os parâmetros na reposição para acompanhar a necessidade de compra.' }}</p><NuxtLink to="/replenishment" class="text-link">{{ dashboard.products?.pending ? 'Conferir pendências' : 'Consultar reposição' }} <span aria-hidden="true">→</span></NuxtLink></div>
          <footer v-if="dashboard.priorities.length" class="operation-card-footer">Até cinco sugestões da base completa. Confira quantidades e justificativas antes de salvar uma rodada.</footer>
        </section>
        <section class="dashboard-card operation-rounds" aria-labelledby="rounds-heading">
          <header><div><p class="card-kicker">ACOMPANHE A REVISÃO</p><h2 id="rounds-heading">Rodadas locais</h2></div><UIcon name="i-lucide-clipboard-check" /></header>
          <dl class="operation-round-totals"><div><dt>Em revisão</dt><dd>{{ formatNumber(dashboard.rounds.draft) }}</dd></div><div><dt>Revisadas</dt><dd>{{ formatNumber(dashboard.rounds.reviewed) }}</dd></div></dl>
          <p v-if="!dashboard.rounds.recent.length" class="operation-rounds-empty">Nenhuma rodada salva. Selecione os produtos na reposição para preparar sua primeira revisão.</p>
          <ul v-else class="operation-recent-rounds" aria-label="Rodadas mais recentes"><li v-for="round in dashboard.rounds.recent" :key="round.id"><span class="operation-round-state" :class="{ reviewed: round.state === 'reviewed' }">{{ round.state === 'reviewed' ? 'Revisada' : 'Em revisão' }}</span><h3>Revisão de compra</h3><p>{{ formatDate(round.createdAt) }} · {{ round.itemCount }} {{ round.itemCount === 1 ? 'item' : 'itens' }}</p><small v-if="round.previousData">Usa uma versão anterior dos dados.</small></li></ul>
          <NuxtLink to="/purchase-drafts" class="text-link operation-rounds-link">Consultar rodadas <span aria-hidden="true">→</span></NuxtLink>
          <p class="operation-local-note"><UIcon name="i-lucide-shield-check" />Revisão local. Nenhum pedido é enviado ao ERP ou ao fornecedor.</p>
        </section>
      </div>
      <details class="operation-data-notes"><summary>Como interpretar estes indicadores</summary><p>Os totais de produtos consideram toda a base sincronizada, sem os filtros ou a paginação da reposição. Pendências e risco podem ocorrer no mesmo produto.</p><p>O risco só é contado quando há uma data de ruptura calculada. Dados incompletos não significam ausência de risco. Zero sugestões prontas pode indicar bloqueios de cadastro, configuração ou validação da integração.</p><p>As rodadas mostram o estado salvo no Grand Cru. Uma revisão concluída não comprova compra nem recebimento e não reduz a sugestão de reposição.</p></details>
    </template>
  </section>
</template>
