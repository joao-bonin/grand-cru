<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PurchaseDraft, Recommendation } from '../../shared/types/replenishment'
definePageMeta({ middleware: ['auth'] })
const auth = useAuth(); const route = useRoute()
const canEdit = computed(() => auth.user.value?.role === 'admin')
const { data, error: loadError, refresh } = await useFetch<{ drafts: PurchaseDraft[] }>('/api/purchase-drafts')
const current = ref<PurchaseDraft | null>(null)
const pending = ref(false); const error = ref(''); const success = ref('')
if (typeof route.query.items === 'string' && typeof route.query.snapshot === 'string' && canEdit.value) {
  try {
    const selection = JSON.parse(route.query.items) as Array<{ productId: string, storeId: string }>
    if (!Array.isArray(selection) || !selection.length || selection.some(identity => !identity || typeof identity.productId !== 'string' || !identity.productId.trim() || typeof identity.storeId !== 'string' || !identity.storeId.trim())) throw new Error('Seleção inválida')
    const response = await useRequestFetch()<{ items: Recommendation[], snapshotId: string | null }>('/api/replenishment')
    if (response.snapshotId !== route.query.snapshot) throw new Error('Os dados mudaram. Selecione os itens novamente na reposição.')
    const selected = selection.map(identity => response.items.find(item => item.product.id === identity.productId && item.product.storeId === identity.storeId))
    if (selected.some(item => !item || item.suggested === null || !item.policy || item.issues.length)) throw new Error('Seleção indisponível. Revise as pendências na reposição.')
    current.value = { id: '', key: crypto.randomUUID(), snapshotId: response.snapshotId!, author: auth.user.value!.login, createdAt: new Date().toISOString(), version: 0, state: 'draft', total: null, items: selected.map(item => ({ productId: item!.product.id, storeId: item!.product.storeId, supplierId: item!.policy!.supplierId, description: item!.product.description, suggested: item!.suggested!, adjusted: item!.suggested!, packSize: item!.policy!.packSize, unitCost: item!.policy!.cost, policyVersion: item!.policy!.version })) }
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível preparar a rodada local.' }
}
async function save(command: { id?: string, key: string, snapshotId: string, version?: number, state: 'draft' | 'reviewed', items: Array<{ productId: string, storeId: string, adjusted: number, expectedPolicyVersion: number }> }) {
  if (!canEdit.value || pending.value) return
  pending.value = true; error.value = ''; success.value = ''
  try {
    const result = await $fetch<{ draft: PurchaseDraft }>('/api/purchase-drafts', { method: 'POST', body: command })
    current.value = result.draft
    await refresh()
    success.value = 'Rodada salva no Grand Cru. Nenhum pedido foi enviado ao ERP.'
    await navigateTo('/purchase-drafts', { replace: true })
  } catch (cause) {
    const status = (cause as { statusCode?: number, status?: number }).statusCode ?? (cause as { status?: number }).status
    error.value = status === 409 ? 'Conflito de versão. Reabra a rodada no histórico ou selecione novamente os dados atuais. Seus ajustes continuam visíveis.' : 'Não foi possível salvar a rodada. Seus ajustes continuam visíveis.'
  } finally { pending.value = false }
}
function open(draft: PurchaseDraft) { current.value = draft; error.value = ''; success.value = '' }
</script>

<template>
  <AppShell :user="auth.user.value" active="purchase-drafts" @logout="auth.logout">
    <div class="replenishment-page">
      <header class="admin-page-heading"><div><p class="admin-kicker">COMPRADOR VIRTUAL</p><h1>Rodadas locais</h1><p>Prepare compras e acompanhe suas decisões por fornecedor.</p></div><NuxtLink to="/replenishment">Selecionar produtos</NuxtLink></header>
      <p class="dashboard-card">ERP somente leitura. Salvar ou concluir a revisão altera apenas o rascunho no Grand Cru.</p>
      <p v-if="success" role="status">{{ success }}</p>
      <p v-if="error && !current" role="alert">{{ error }}</p>
      <PurchaseDraftEditor v-if="current" :draft="current" :can-edit="canEdit" :pending="pending" :error="error" @save="save" />
      <PurchaseDraftHistory :drafts="data?.drafts ?? []" :error="loadError ? 'Não foi possível consultar o histórico de rodadas.' : ''" @open="open" @retry="refresh()" />
    </div>
  </AppShell>
</template>

<style src="../assets/css/replenishment.css"></style>
