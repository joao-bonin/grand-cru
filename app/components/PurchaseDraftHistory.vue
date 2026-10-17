<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { PurchaseDraft } from '../../shared/types/replenishment'
defineProps<{ drafts: PurchaseDraft[], error?: string }>()
const ready = ref(false)
onMounted(() => { ready.value = true })
defineEmits<{ open: [draft: PurchaseDraft], retry: [] }>()
</script>

<template>
  <section class="purchase-draft-history" aria-label="Histórico de rodadas locais">
    <h2>Histórico de rodadas locais</h2><p>A pendência local não representa recebimento e não reduz a necessidade de reposição.</p>
    <div v-if="error" role="alert">{{ error }}<button type="button" @click="$emit('retry')">Tentar novamente</button></div>
    <p v-else-if="!drafts.length">Nenhuma rodada local salva.</p>
    <article v-for="draft in drafts" :key="draft.id" class="dashboard-card">
      <h3>{{ draft.state === 'reviewed' ? 'Revisão local concluída' : 'Rascunho local' }} · {{ draft.id }}</h3>
      <p>{{ draft.author }} · {{ new Date(draft.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }}</p><p>Versão {{ draft.version }} · Dados {{ draft.snapshotId }}</p>
      <div v-for="supplier in [...new Set(draft.items.map(item => item.supplierId))]" :key="supplier"><h4>Fornecedor {{ supplier }}</h4><ul><li v-for="item in draft.items.filter(row => row.supplierId === supplier)" :key="`${item.productId}/${item.storeId}`">{{ item.description }} ({{ item.productId }}) · sugestão {{ item.suggested }} · ajuste {{ item.adjusted }}</li></ul></div>
      <p>Total estimado: {{ draft.total === null ? 'Indisponível' : draft.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</p>
      <button type="button" :disabled="!ready" @click="$emit('open', draft)">Abrir rodada {{ draft.id }}</button>
    </article>
  </section>
</template>
