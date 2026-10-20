<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BusinessDashboardReport, DashboardCoverage } from '../../shared/types/dashboard'
import { dashboardSalesWindows } from '#shared/types/dashboard'
import { summarizeReplenishmentIssues } from '#shared/presentation/replenishment-issues'

const props = defineProps<{ report: BusinessDashboardReport }>()
const search = ref('')
const store = ref('')
const page = ref(1)
const pageSize = 12
const number = (value: number | null, digits = 1) => value === null ? 'Indisponível' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value)
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
const timestamp = computed(() => props.report.snapshot ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(props.report.snapshot.createdAt)) : '')
const stores = computed(() => [...new Set(props.report.items.map(item => item.storeId))].sort())
const filtered = computed(() => props.report.items.filter(item => (!store.value || store.value === item.storeId)
  && `${item.description} ${item.productId}`.toLocaleLowerCase('pt-BR').includes(search.value.trim().toLocaleLowerCase('pt-BR'))))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch([search, store, () => props.report], () => { page.value = 1 })
const coverageLabel = (metric: DashboardCoverage) => metric.evaluated === 0 && metric.unavailable > 0 ? 'Indisponível' : number(metric.count, 0)
const coverageNote = (metric: DashboardCoverage) => `${metric.evaluated} ${metric.evaluated === 1 ? 'produto avaliado' : 'produtos avaliados'}${metric.unavailable ? ` · ${metric.unavailable} sem cálculo` : ''}`
const segments = computed(() => props.report.summary ? [
  { label: 'Precisam de reposição', count: props.report.summary.replenishment.count, tone: 'attention' },
  { label: 'Sem reposição sugerida', count: props.report.summary.calculable - props.report.summary.replenishment.count, tone: 'stable' },
  { label: 'Com pendências de cálculo', count: props.report.summary.blocked, tone: 'pending' },
] : [])
const status = { replenishment: 'Repor estoque', without_replenishment: 'Sem reposição sugerida', blocked: 'Cálculo pendente' }
</script>

<template>
  <div class="business-dashboard">
    <header class="business-heading">
      <div><p class="admin-kicker">ESTOQUE E COMPRAS</p><h1>Dashboard</h1><p>Prioridades de reposição, cobertura e qualidade dos dados por produto e loja.</p></div>
      <NuxtLink to="/replenishment" class="business-action">Abrir reposição <span aria-hidden="true">→</span></NuxtLink>
    </header>

    <section v-if="report.state === 'awaiting_snapshot'" class="business-panel business-empty" aria-labelledby="awaiting-title">
      <UIcon name="i-lucide-database" aria-hidden="true" />
      <h2 id="awaiting-title">Aguardando a primeira atualização</h2>
      <p>Os indicadores aparecerão quando houver uma versão de estoque salva. Sem essa base, não é possível avaliar reposição ou risco de ruptura.</p>
      <NuxtLink to="/replenishment" class="business-action">Consultar atualização dos dados</NuxtLink>
    </section>

    <template v-else>
      <p class="business-reference">Base dos indicadores: <time :datetime="report.snapshot.createdAt">{{ timestamp }} (Brasília)</time>. Os cálculos usam essa data de referência.</p>
      <div class="business-metrics" aria-label="Indicadores de estoque e compras">
        <article class="business-panel business-metric"><h2>Produtos acompanhados</h2><strong>{{ number(report.summary.tracked, 0) }}</strong><p>Cada produto em cada loja conta uma vez.</p></article>
        <article class="business-panel business-metric"><h2>Precisam de reposição</h2><strong>{{ coverageLabel(report.summary.replenishment) }}</strong><p>{{ coverageNote(report.summary.replenishment) }}</p></article>
        <article class="business-panel business-metric"><h2>Risco de ruptura</h2><strong>{{ coverageLabel(report.summary.risk) }}</strong><p>{{ coverageNote(report.summary.risk) }}</p><small>No prazo de entrega + revisão de cada política.</small></article>
        <article class="business-panel business-metric"><h2>Cálculos pendentes</h2><strong>{{ number(report.summary.blocked, 0) }}</strong><p>Dados ou políticas precisam de revisão.</p></article>
      </div>

      <section class="business-panel business-situation" aria-labelledby="situation-title">
        <div><h2 id="situation-title">Situação do estoque</h2><p>Quantidade de produtos por loja. Pendências ficam separadas dos resultados avaliados.</p></div>
        <div v-if="report.summary.tracked" class="business-chart" aria-hidden="true"><span v-for="segment in segments" :key="segment.tone" :class="segment.tone" :style="{ width: `${segment.count / report.summary.tracked * 100}%` }" /></div>
        <p v-else>Nenhum produto consta nesta versão de estoque.</p>
        <ul class="business-legend"><li v-for="segment in segments" :key="segment.tone"><span :class="segment.tone" aria-hidden="true" />{{ segment.label }} <strong>{{ segment.count }}</strong></li></ul>
      </section>

      <section class="business-panel business-products" aria-labelledby="priorities-title">
        <header><h2 id="priorities-title">Prioridades por produto</h2><p>Rupturas projetadas primeiro, seguidas de reposição e pendências. Quantidades de lojas e produtos diferentes não são somadas.</p></header>
        <div v-if="report.items.length" class="business-filters">
          <label>Buscar produto<input v-model="search" type="search" placeholder="Nome ou código do produto"></label>
          <label>Loja<select v-model="store"><option value="">Todas as lojas</option><option v-for="id in stores" :key="id" :value="id">Loja {{ id }}</option></select></label>
        </div>
        <p v-if="!filtered.length" class="business-list-empty">{{ report.items.length ? 'Nenhum produto corresponde aos filtros.' : 'Esta versão foi atualizada sem produtos. Revise a origem dos dados em Reposição.' }}</p>
        <div class="business-product-list">
          <article v-for="item in visible" :key="JSON.stringify([item.storeId, item.productId])" class="business-product">
            <header><div><h3>{{ item.description }}</h3><p>Código {{ item.productId }} · Loja {{ item.storeId }}</p></div><span class="business-status" :class="item.state">{{ status[item.state] }}</span></header>
            <dl class="business-product-metrics">
              <div><dt>Estoque disponível</dt><dd>{{ number(item.available) }}</dd></div>
              <div><dt>Estoque mínimo</dt><dd>{{ number(item.minimum) }}</dd></div>
              <div><dt>Cobertura</dt><dd>{{ item.coverageDays === null ? 'Não calculada' : `${number(item.coverageDays)} dias` }}</dd></div>
              <div><dt>Ruptura projetada</dt><dd>{{ item.ruptureDate ? date(item.ruptureDate) : item.riskEvaluated ? 'Não identificada no horizonte' : 'Não avaliada' }}</dd></div>
              <div><dt>Reposição sugerida</dt><dd>{{ number(item.suggested) }}</dd></div>
              <div><dt>Excesso sobre o alvo</dt><dd>{{ number(item.excess) }}</dd></div>
            </dl>
            <div class="business-sales"><h4>Vendas líquidas observadas</h4><dl><div v-for="days in dashboardSalesWindows" :key="days"><dt>{{ days }} dias</dt><dd>{{ number(item.sales[days].quantity) }}<small v-if="item.sales[days].partial">Histórico parcial</small></dd></div></dl></div>
            <p v-if="item.horizonDays !== null" class="business-product-note">Horizonte da política: {{ item.horizonDays }} dias. Cobertura não é calculada quando não há consumo médio positivo.</p>
            <details v-if="item.issues.length" class="business-issues"><summary>Ver pendências do cálculo</summary><ul><li v-for="notice in summarizeReplenishmentIssues(item.issues)" :key="notice.key"><strong>{{ notice.title }}</strong><p v-if="notice.description">{{ notice.description }}</p></li></ul></details>
          </article>
        </div>
        <nav v-if="filtered.length" class="business-pagination" aria-label="Páginas de produtos"><button :disabled="page <= 1" @click="page--">Anterior</button><span role="status">Página {{ page }} de {{ pages }} · {{ filtered.length }} produtos</span><button :disabled="page >= pages" @click="page++">Próxima</button></nav>
      </section>
    </template>
    <aside class="business-data-note"><h2>Sobre os dados</h2><p>Os indicadores usam a última versão local disponível e as políticas de reposição cadastradas. A validação com dados reais do ERP continua pendente. Indicadores financeiros, CRM e demanda B2B integrada ainda não estão disponíveis neste dashboard.</p></aside>
  </div>
</template>
