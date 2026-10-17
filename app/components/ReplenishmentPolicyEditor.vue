<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Policy } from '../../shared/types/replenishment'
const props = defineProps<{ productId: string, storeId: string, policy?: Policy | null, canEdit?: boolean, pending?: boolean, error?: string }>()
const emit = defineEmits<{ save: [policy: Policy] }>()
const fields = [
  { key: 'windowDays', label: 'Janela de consumo (dias)', min: 1 },
  { key: 'leadDays', label: 'Prazo do fornecedor (dias)', min: 0 },
  { key: 'reviewDays', label: 'Intervalo de revisão (dias)', min: 0 },
  { key: 'safetyUnits', label: 'Segurança (unidades)', min: 0 },
  { key: 'minimum', label: 'Estoque mínimo (unidades)', min: 0 },
  { key: 'packSize', label: 'Unidades por embalagem', min: 1 },
] as const
const values = reactive<Record<string, string | number>>({})
const validation = ref('')
watch(() => props.policy, (policy) => {
  for (const field of fields) values[field.key] = policy?.[field.key] ?? ''
  values.supplierId = policy?.supplierId ?? ''
  values.cost = policy?.cost ?? ''
}, { immediate: true })
function save() {
  if (!props.canEdit || props.pending) return
  const valid = fields.every(field => values[field.key] !== '' && Number.isFinite(Number(values[field.key])) && Number(values[field.key]) >= field.min && (!['windowDays', 'leadDays', 'reviewDays', 'packSize'].includes(field.key) || Number.isSafeInteger(Number(values[field.key]))) && (!['windowDays', 'leadDays', 'reviewDays'].includes(field.key) || Number(values[field.key]) <= 3650))
  const cost = values.cost === '' ? null : Number(values.cost)
  if (!valid || !String(values.supplierId).trim() || (cost !== null && (!Number.isFinite(cost) || cost < 0))) {
    validation.value = 'Preencha os parâmetros com valores válidos e informe fornecedor e embalagem.'
    return
  }
  validation.value = ''
  emit('save', { productId: props.productId, storeId: props.storeId, windowDays: Number(values.windowDays), leadDays: Number(values.leadDays), reviewDays: Number(values.reviewDays), safetyUnits: Number(values.safetyUnits), minimum: Number(values.minimum), packSize: Number(values.packSize), cost, supplierId: String(values.supplierId).trim(), version: props.policy?.version ?? 0 })
}
</script>

<template>
  <form class="replenishment-policy" @submit.prevent="save">
    <h3>Parâmetros locais · {{ productId }} / {{ storeId }}</h3>
    <p>Informe os parâmetros para calcular a sugestão. Nenhum valor é enviado ao ERP.</p>
    <p v-if="error || validation" role="alert">{{ error || validation }}</p>
    <fieldset :disabled="!canEdit || pending">
      <label v-for="field in fields" :key="field.key">{{ field.label }}<input v-model="values[field.key]" :name="field.key" type="number" :min="field.min" :step="['windowDays', 'leadDays', 'reviewDays', 'packSize'].includes(field.key) ? 1 : 'any'" :max="['windowDays', 'leadDays', 'reviewDays'].includes(field.key) ? 3650 : undefined" required></label>
      <label>Identificador do fornecedor<input v-model="values.supplierId" name="supplierId" required></label>
      <label>Custo por unidade (opcional)<input v-model="values.cost" name="cost" type="number" min="0" step="0.01"></label>
      <button type="submit">{{ pending ? 'Salvando…' : 'Salvar parâmetros locais' }}</button>
    </fieldset>
  </form>
</template>
