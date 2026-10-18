<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { isActionableRecommendation, queryRecommendations } from '#shared/application/replenishment-query'
import type { Recommendation, RecommendationPagination, RecommendationFilters } from '../../shared/types/replenishment'
import ReplenishmentExplanation from './ReplenishmentExplanation.vue'
import ReplenishmentSelectionHelp from './ReplenishmentSelectionHelp.vue'
const props = defineProps<{ items: Recommendation[], error?: string, loading?: boolean, canSelect?: boolean, pagination?: RecommendationPagination }>()
const emit = defineEmits<{ retry: [], selection: [items: Array<{ productId: string, storeId: string }>], policy: [item: Recommendation], filters: [filters: RecommendationFilters], page: [start: number] }>()
const search = ref(''); const supplier = ref(''); const risk = ref(false)
const view = ref<'purchase' | 'issues' | 'all'>('purchase')
const selected = ref<string[]>([])
const ready = ref(false)
onMounted(() => { ready.value = true })
const suppliers = computed(() => props.pagination?.supplierIds ?? queryRecommendations(props.items, {}).supplierIds)
const filtered = computed(() => props.pagination ? props.items : queryRecommendations(props.items, { product: search.value, supplier: supplier.value, issues: view.value === 'issues' ? true : undefined, risk: risk.value || undefined, actionable: view.value === 'purchase' ? true : undefined }).items)
watch([search, supplier, view, risk], () => {
  selected.value = []; select()
  emit('filters', { product: search.value, supplier: supplier.value, issues: view.value === 'issues', risk: risk.value, actionable: view.value === 'purchase' })
})
function page(start: number) {
  if (props.loading) return
  selected.value = []; select()
  emit('page', start)
}
watch(() => props.items, () => {
  const available = props.items.filter(isActionableRecommendation).map(item => `${item.product.id}/${item.product.storeId}`)
  selected.value = selected.value.filter(identity => available.includes(identity))
  select()
})
function select() { emit('selection', props.items.filter(item => selected.value.includes(`${item.product.id}/${item.product.storeId}`)).map(item => ({ productId: item.product.id, storeId: item.product.storeId }))) }
</script>

<template>
  <section class="replenishment-list" aria-label="Sugestões de reposição">
    <div class="replenishment-views" role="group" aria-label="Mostrar produtos">
      <button type="button" data-view="purchase" :aria-pressed="view === 'purchase'" @click="view = 'purchase'">Para comprar</button>
      <button type="button" data-view="issues" :aria-pressed="view === 'issues'" @click="view = 'issues'">Pendências</button>
      <button type="button" data-view="all" :aria-pressed="view === 'all'" @click="view = 'all'">Todos</button>
    </div>
    <div class="replenishment-filters">
      <label>Produto<input v-model="search" name="product" type="search" maxlength="100" placeholder="SKU ou descrição"></label>
      <details class="replenishment-more-filters">
        <summary>Mais filtros{{ supplier || risk ? ' · ativos' : '' }}</summary>
        <div>
          <label>Fornecedor<select v-model="supplier" name="supplier"><option value="">Todos</option><option v-for="id in suppliers" :key="id" :value="id">{{ id }}</option></select></label>
          <label><input v-model="risk" name="risk" type="checkbox">Com risco de ruptura</label>
        </div>
      </details>
    </div>
    <div v-if="error" role="alert"><p>{{ error }}</p><button data-retry type="button" @click="$emit('retry')">Tentar novamente</button></div>
    <p v-if="loading" role="status">Carregando recomendações…</p>
    <nav v-if="pagination" class="replenishment-pagination" aria-label="Paginação de produtos">
      <p role="status">{{ pagination.total ? pagination.start + 1 : 0 }}–{{ Math.min(pagination.start + items.length, pagination.total) }} de {{ pagination.total }} {{ pagination.total === 1 ? 'produto' : 'produtos' }}</p>
      <div>
        <button type="button" :disabled="loading || pagination.start === 0" @click="page(Math.max(0, pagination.start - pagination.count))">Anterior</button>
        <span>Página {{ Math.floor(pagination.start / pagination.count) + 1 }} de {{ Math.max(1, Math.ceil(pagination.total / pagination.count)) }}</span>
        <button type="button" :disabled="loading || pagination.start + pagination.count >= pagination.total" @click="page(pagination.start + pagination.count)">Próxima</button>
      </div>
      <small v-if="canSelect">A seleção vale para esta página. Revisar antes de mudar de página ou filtros.</small>
    </nav>
    <article v-for="item in filtered" :key="`${item.product.id}/${item.product.storeId}`" class="dashboard-card replenishment-item">
      <h2>{{ item.product.description }}</h2><p>Loja {{ item.product.storeId }} · Fornecedor {{ item.policy?.supplierId ?? item.product.supplierId ?? 'Pendente' }}</p>
      <p class="replenishment-quantity">{{ item.issues.length || item.suggested === null ? 'Compra bloqueada' : item.suggested > 0 ? `Comprar ${item.suggested} unidades` : 'Sem compra sugerida' }}</p>
      <p v-if="item.ruptureDate">Risco de ruptura: {{ item.ruptureDate }}</p>
      <div v-if="canSelect" class="replenishment-selection">
        <label><input v-model="selected" :name="`select-${item.product.id}-${item.product.storeId}`" type="checkbox" :value="`${item.product.id}/${item.product.storeId}`" :disabled="!ready || loading || !isActionableRecommendation(item)" @change="select">Incluir na rodada local</label>
        <ReplenishmentSelectionHelp v-if="loading || !isActionableRecommendation(item)" :item="item" :pending="loading" @configure="$emit('policy', item)" />
      </div>
      <details>
        <summary>Ver justificativa e pendências</summary>
        <p>SKU {{ item.product.id }}</p>
        <button v-if="canSelect" data-policy type="button" @click="$emit('policy', item)">Parâmetros de compra</button>
        <ReplenishmentExplanation :item="item" />
      </details>
    </article>
    <p v-if="!filtered.length && !error && !loading" role="status">Nenhum produto encontrado{{ view === 'purchase' ? ' para comprar. Confira Pendências ou Todos.' : '. Revise os filtros ou atualize os dados.' }}</p>
  </section>
</template>
