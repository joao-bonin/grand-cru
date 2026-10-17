<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Recommendation } from '../../shared/types/replenishment'
import ReplenishmentExplanation from './ReplenishmentExplanation.vue'
const props = defineProps<{ items: Recommendation[], error?: string, loading?: boolean, canSelect?: boolean }>()
const emit = defineEmits<{ retry: [], selection: [items: Array<{ productId: string, storeId: string }>], policy: [item: Recommendation] }>()
const search = ref(''); const supplier = ref(''); const issues = ref(false); const risk = ref(false)
const selected = ref<string[]>([])
const suppliers = computed(() => [...new Set(props.items.map(item => item.policy?.supplierId ?? item.product.supplierId).filter((id): id is string => !!id))])
const filtered = computed(() => props.items.filter(item => `${item.product.id} ${item.product.description}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()) && (!supplier.value || (item.policy?.supplierId ?? item.product.supplierId) === supplier.value) && (!issues.value || item.issues.length > 0) && (!risk.value || item.ruptureDate !== null)).sort((a, b) => (a.ruptureDate ?? '9999').localeCompare(b.ruptureDate ?? '9999')))
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
      <label>Produto<input v-model="search" name="product" type="search" placeholder="SKU ou descrição"></label>
      <label>Fornecedor<select v-model="supplier" name="supplier"><option value="">Todos</option><option v-for="id in suppliers" :key="id" :value="id">{{ id }}</option></select></label>
      <label><input v-model="risk" name="risk" type="checkbox">Com risco de ruptura</label>
      <label><input v-model="issues" name="issues" type="checkbox">Com pendências</label>
    </div>
    <div v-if="error" role="alert"><p>{{ error }}</p><button data-retry type="button" @click="$emit('retry')">Tentar novamente</button></div>
    <p v-if="loading" role="status">Carregando recomendações…</p>
    <article v-for="item in filtered" :key="`${item.product.id}/${item.product.storeId}`" class="dashboard-card replenishment-item">
      <h2>{{ item.product.description }}</h2><p>SKU {{ item.product.id }} · Loja {{ item.product.storeId }} · Fornecedor {{ item.policy?.supplierId ?? item.product.supplierId ?? 'Pendente' }}</p>
      <p class="replenishment-quantity">Sugestão: {{ item.suggested === null ? 'Indisponível' : `${item.suggested} unidades` }}</p>
      <p v-if="item.ruptureDate">Risco de ruptura: {{ item.ruptureDate }}</p>
      <label v-if="canSelect"><input v-model="selected" :name="`select-${item.product.id}-${item.product.storeId}`" type="checkbox" :value="`${item.product.id}/${item.product.storeId}`" :disabled="item.suggested === null || item.issues.length > 0" @change="select">Incluir na rodada local</label>
      <button v-if="canSelect" type="button" @click="$emit('policy', item)">Parâmetros de compra</button>
      <details><summary>Ver justificativa e pendências</summary><ReplenishmentExplanation :item="item" /></details>
    </article>
    <p v-if="!filtered.length && !error && !loading">Nenhum produto encontrado. Revise os filtros ou atualize os dados.</p>
  </section>
</template>
