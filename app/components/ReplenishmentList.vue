<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { queryRecommendations } from '../../shared/application/replenishment-query'
import type { Recommendation, RecommendationPagination, RecommendationFilters } from '../../shared/types/replenishment'
import ReplenishmentExplanation from './ReplenishmentExplanation.vue'
const props = defineProps<{ items: Recommendation[], error?: string, loading?: boolean, canSelect?: boolean, pagination?: RecommendationPagination }>()
const emit = defineEmits<{ retry: [], selection: [items: Array<{ productId: string, storeId: string }>], policy: [item: Recommendation], filters: [filters: RecommendationFilters], page: [start: number] }>()
const search = ref(''); const supplier = ref(''); const issues = ref(false); const risk = ref(false)
const selected = ref<string[]>([])
const suppliers = computed(() => props.pagination?.supplierIds ?? queryRecommendations(props.items, {}).supplierIds)
const filtered = computed(() => props.pagination ? props.items : queryRecommendations(props.items, { product: search.value, supplier: supplier.value, issues: issues.value || undefined, risk: risk.value || undefined }).items)
watch([search, supplier, issues, risk], () => {
  if (!props.pagination) return
  selected.value = []; select()
  emit('filters', { product: search.value, supplier: supplier.value, issues: issues.value, risk: risk.value })
})
function page(start: number) {
  if (props.loading) return
  selected.value = []; select()
  emit('page', start)
}
watch(() => props.items, () => {
  const available = props.items.filter(item => item.suggested !== null && !item.issues.length).map(item => `${item.product.id}/${item.product.storeId}`)
  selected.value = selected.value.filter(identity => available.includes(identity))
  select()
})
function select() { emit('selection', props.items.filter(item => selected.value.includes(`${item.product.id}/${item.product.storeId}`)).map(item => ({ productId: item.product.id, storeId: item.product.storeId }))) }
</script>

<template>
  <section class="replenishment-list" aria-label="Sugestões de reposição">
    <div class="replenishment-filters">
      <label>Produto<input v-model="search" name="product" type="search" maxlength="100" placeholder="SKU ou descrição"></label>
      <label>Fornecedor<select v-model="supplier" name="supplier"><option value="">Todos</option><option v-for="id in suppliers" :key="id" :value="id">{{ id }}</option></select></label>
      <label><input v-model="risk" name="risk" type="checkbox">Com risco de ruptura</label>
      <label><input v-model="issues" name="issues" type="checkbox">Com pendências</label>
    </div>
    <div v-if="error" role="alert"><p>{{ error }}</p><button data-retry type="button" @click="$emit('retry')">Tentar novamente</button></div>
    <p v-if="loading" role="status">Carregando recomendações…</p>
    <nav v-if="pagination" class="replenishment-pagination" aria-label="Paginação de produtos">
      <p role="status">{{ pagination.total ? pagination.start + 1 : 0 }}–{{ Math.min(pagination.start + items.length, pagination.total) }} de {{ pagination.total }} produtos</p>
      <div>
        <button type="button" :disabled="loading || pagination.start === 0" @click="page(Math.max(0, pagination.start - pagination.count))">Anterior</button>
        <span>Página {{ Math.floor(pagination.start / pagination.count) + 1 }} de {{ Math.max(1, Math.ceil(pagination.total / pagination.count)) }}</span>
        <button type="button" :disabled="loading || pagination.start + pagination.count >= pagination.total" @click="page(pagination.start + pagination.count)">Próxima</button>
      </div>
      <small v-if="canSelect">A seleção vale para esta página. Revisar antes de mudar de página ou filtros.</small>
    </nav>
    <article v-for="item in filtered" :key="`${item.product.id}/${item.product.storeId}`" class="dashboard-card replenishment-item">
      <h2>{{ item.product.description }}</h2><p>SKU {{ item.product.id }} · Loja {{ item.product.storeId }} · Fornecedor {{ item.policy?.supplierId ?? item.product.supplierId ?? 'Pendente' }}</p>
      <p class="replenishment-quantity">Sugestão: {{ item.suggested === null ? 'Indisponível' : `${item.suggested} unidades` }}</p>
      <p v-if="item.ruptureDate">Risco de ruptura: {{ item.ruptureDate }}</p>
      <label v-if="canSelect"><input v-model="selected" :name="`select-${item.product.id}-${item.product.storeId}`" type="checkbox" :value="`${item.product.id}/${item.product.storeId}`" :disabled="loading || item.suggested === null || item.issues.length > 0" @change="select">Incluir na rodada local</label>
      <button v-if="canSelect" type="button" @click="$emit('policy', item)">Parâmetros de compra</button>
      <details><summary>Ver justificativa e pendências</summary><ReplenishmentExplanation :item="item" /></details>
    </article>
    <p v-if="!filtered.length && !error && !loading">Nenhum produto encontrado. Revise os filtros ou atualize os dados.</p>
  </section>
</template>
