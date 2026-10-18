<script setup lang="ts">
import type { SyncStatus } from '../../shared/types/replenishment'
defineProps<{ status: SyncStatus | null, snapshot?: { id: string, createdAt: string } | null, configured?: boolean, canSync?: boolean, pending?: boolean, error?: string }>()
defineEmits<{ sync: [] }>()
function errorMessage(error: string | null | undefined) { return error === 'ERP_AUTHENTICATION_PENDING' ? 'Autenticação do ERP pendente. Configure um token de leitura válido no servidor.' : error }
const labels = { idle: 'Aguardando atualização', running: 'Atualização em andamento', success: 'Atualização concluída', failed: 'Falha na atualização' }
</script>

<template>
  <section class="dashboard-card replenishment-sync" aria-label="Estado da sincronização" aria-live="polite">
    <div class="replenishment-sync-heading">
      <div>
        <h2>Atualização dos dados</h2>
        <p v-if="snapshot">Atualizado em {{ new Date(snapshot.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }}</p>
        <p v-else>Nenhuma versão publicada.</p>
      </div>
      <button v-if="canSync" type="button" :disabled="pending || status?.state === 'running' || !configured" @click="$emit('sync')">{{ pending || status?.state === 'running' ? 'Atualizando…' : 'Atualizar agora' }}</button>
    </div>
    <p v-if="pending || status?.state === 'running'" role="status">Atualização em andamento.</p>
    <p v-else-if="status?.state === 'failed'" role="status">Falha na atualização. Os dados anteriores foram preservados.</p>
    <p v-if="!configured">Acesso de leitura precisa ser configurado no servidor.</p>
    <p v-if="error || status?.error" role="alert">{{ errorMessage(error || status?.error) }}</p>
    <details>
      <summary>Detalhes da atualização</summary>
      <p>{{ status ? labels[status.state] : 'Estado indisponível' }}</p>
      <p v-if="snapshot">Versão {{ snapshot.id }}</p>
      <p>ERP somente leitura. As rodadas são salvas apenas no Grand Cru.</p>
    </details>
  </section>
</template>
