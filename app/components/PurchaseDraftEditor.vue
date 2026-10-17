<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PurchaseDraft } from '../../shared/types/replenishment'
const props = defineProps<{ draft: PurchaseDraft, canEdit?: boolean, pending?: boolean, error?: string }>()
const emit = defineEmits<{ save: [command: { id?: string, key: string, snapshotId: string, version?: number, state: 'draft' | 'reviewed', items: Array<{ productId: string, storeId: string, adjusted: number, expectedPolicyVersion: number }> }] }>()
const items = ref(props.draft.items.map(item => ({ ...item })))
const confirmed = ref(false); const validation = ref('')
watch(() => props.draft, draft => { items.value = draft.items.map(item => ({ ...item })); confirmed.value = false; validation.value = '' })
const total = computed(() => items.value.some(item => item.unitCost === null) ? null : items.value.reduce((sum, item) => sum + Number(item.adjusted) * item.unitCost!, 0))
const suppliers = computed(() => [...new Set(items.value.map(item => item.supplierId))])
function save(state: 'draft' | 'reviewed') {
  if (!props.canEdit || props.pending) return
  if (!items.value.length || items.value.some(item => !Number.isFinite(Number(item.adjusted)) || Number(item.adjusted) < 0 || !item.packSize || Math.abs(Number(item.adjusted) / item.packSize - Math.round(Number(item.adjusted) / item.packSize)) > 0.000001)) { validation.value = 'Informe quantidades válidas e compatíveis com a embalagem; mantenha ao menos um item.'; return }
  if (state === 'reviewed' && !confirmed.value) { validation.value = 'Confirme a revisão local antes de continuar.'; return }
  validation.value = ''
  emit('save', { ...(props.draft.id ? { id: props.draft.id, version: props.draft.version } : {}), key: props.draft.key, snapshotId: props.draft.snapshotId, state, items: items.value.map(item => ({ productId: item.productId, storeId: item.storeId, adjusted: Number(item.adjusted), expectedPolicyVersion: item.policyVersion })) })
}
</script>

<template>
  <form class="dashboard-card purchase-draft-editor" @submit.prevent="save('draft')">
    <h2>Revisão da rodada local</h2><p>Nenhum pedido será enviado ao ERP. Esta rodada não representa recebimento confirmado.</p>
    <p>Dados: {{ draft.snapshotId }} · Versão {{ draft.version }}</p>
    <p v-if="error || validation" role="alert">{{ error || validation }}</p>
    <fieldset :disabled="!canEdit || pending">
      <section v-for="supplier in suppliers" :key="supplier"><h3>Fornecedor {{ supplier }}</h3>
        <article v-for="item in items.filter(row => row.supplierId === supplier)" :key="`${item.productId}/${item.storeId}`">
          <h4>{{ item.description }} · {{ item.productId }} / {{ item.storeId }}</h4><p>Sugestão original: {{ item.suggested }} unidades · Embalagem: {{ item.packSize }}</p>
          <label>Quantidade ajustada<input v-model.number="item.adjusted" type="number" min="0" :step="item.packSize" :aria-label="`Quantidade ajustada de ${item.description}`"></label>
          <p>Custo unitário: {{ item.unitCost === null ? 'Indisponível' : item.unitCost.toFixed(2) }} · Subtotal: {{ item.unitCost === null ? 'Indisponível' : (item.adjusted * item.unitCost).toFixed(2) }}</p>
          <button data-remove type="button" @click="items = items.filter(row => row !== item)">Remover {{ item.description }}</button>
        </article>
      </section>
      <p>Total estimado: {{ total === null ? 'Indisponível: há itens sem custo.' : total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</p>
      <label><input v-model="confirmed" name="confirmLocal" type="checkbox">Conferi os itens e confirmo apenas a revisão local.</label>
      <div class="replenishment-actions"><button type="submit">Salvar rascunho local</button><button data-review type="button" @click="save('reviewed')">Concluir revisão local</button></div>
    </fieldset>
  </form>
</template>
