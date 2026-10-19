<script setup lang="ts">
import { computed } from 'vue'
import type { SyncDataset, SyncStatus } from '../../shared/types/replenishment'
const props = defineProps<{ status: SyncStatus | null, snapshot?: { id: string, createdAt: string } | null, configured?: boolean, canSync?: boolean, pending?: boolean, error?: string }>()
const emit = defineEmits<{ sync: [] }>()
function errorMessage(error: string | null | undefined) { return error === 'ERP_AUTHENTICATION_PENDING' ? 'Autenticação do ERP pendente. Configure um token de leitura válido no servidor.' : error }
const labels = { idle: 'Aguardando atualização', running: 'Atualização em andamento', success: 'Atualização concluída', failed: 'Falha na atualização' }
const datasets: Array<{ key: SyncDataset, label: string }> = [
  { key: 'catalog', label: 'Catálogo' },
  { key: 'stock', label: 'Estoque' },
  { key: 'sales', label: 'Vendas' },
  { key: 'purchases', label: 'Compras pendentes' },
]
const updating = computed(() => props.pending || props.status?.state === 'running')
const disabled = computed(() => updating.value || !props.configured)
const canResume = computed(() => props.status?.state === 'failed'
  && props.status.progress?.resumable === true
  && props.status.error !== 'ERP_AUTHENTICATION_PENDING'
  && props.error !== 'ERP_AUTHENTICATION_PENDING')
function datasetState(dataset: SyncDataset) {
  if (props.status?.state === 'success' || props.status?.progress?.completed.includes(dataset)) return 'Concluído'
  return props.status?.state === 'running' && props.status.progress?.current === dataset ? 'Em consulta' : 'Pendente'
}
function requestSync() {
  if (!props.canSync || disabled.value) return
  emit('sync')
}
</script>

<template>
  <section class="dashboard-card replenishment-sync" aria-label="Estado da sincronização" aria-live="polite">
    <h2>Dados do Varejo Fácil</h2>
    <p>ERP somente leitura. As rodadas são salvas apenas no Grand Cru.</p>
    <p>{{ status ? labels[status.state] : 'Estado indisponível' }}</p>
    <p v-if="snapshot">Versão {{ snapshot.id }} · {{ new Date(snapshot.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }}</p>
    <p v-else>Nenhuma versão publicada.</p>
    <p v-if="status?.state === 'failed' && snapshot">A última versão publicada permanece válida enquanto a atualização não for concluída.</p>
    <ul v-if="status?.progress" aria-label="Progresso da atualização">
      <li v-for="dataset in datasets" :key="dataset.key">{{ dataset.label }}: {{ datasetState(dataset.key) }}</li>
    </ul>
    <p v-if="canResume">A atualização pode continuar a partir dos dados já concluídos.</p>
    <p v-if="!configured">Acesso de leitura precisa ser configurado no servidor.</p>
    <p v-if="error || status?.error" role="alert">{{ errorMessage(error || status?.error) }}</p>
    <button v-if="canSync" type="button" :disabled="disabled" @click="requestSync">{{ updating ? 'Atualizando…' : canResume ? 'Retomar atualização' : 'Atualizar agora' }}</button>
  </section>
</template>
