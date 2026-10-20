<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Policy, Recommendation, SyncStatus } from '../../shared/types/replenishment'
definePageMeta({ middleware: ['auth'] })
const auth = useAuth()
const canEdit = computed(() => auth.user.value?.role === 'admin')
const { data: sync, error: syncLoadError, refresh: refreshSync } = await useFetch<{ status: SyncStatus, snapshot: { id: string, createdAt: string } | null, configured: boolean }>('/api/erp/status')
const { data, error: loadError, refresh } = await useFetch<{ items: Recommendation[], snapshotId: string | null, policies: Policy[], issues: string[] }>('/api/replenishment')
// Keep the last published response visible when a later request fails.
const published = ref(data.value)
watch(data, value => { if (value && !loadError.value) published.value = value })
const selected = ref<Array<{ productId: string, storeId: string }>>([])
const editing = ref<Recommendation | null>(null)
const syncing = ref(false); const saving = ref(false); const actionError = ref(''); const policyError = ref('')
const policyEditor = ref<{ focusFirstField: () => void } | null>(null)
let policyTrigger: HTMLElement | null = null
const policyOpen = computed({
  get: () => editing.value !== null,
  set: open => { if (!open) closePolicy() },
})
function openPolicy(item: Recommendation) {
  if (!canEdit.value || saving.value) return
  policyTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  policyError.value = ''
  editing.value = item
}
function closePolicy() {
  if (saving.value) return
  editing.value = null
  policyError.value = ''
}
function focusPolicyEditor(event: Event) {
  event.preventDefault()
  void nextTick(() => policyEditor.value?.focusFirstField())
}
function restorePolicyTrigger(event: Event) {
  event.preventDefault()
  if (policyTrigger?.isConnected) policyTrigger.focus()
}
async function update() {
  if (!canEdit.value || syncing.value) return
  syncing.value = true; actionError.value = ''
  try { await $fetch('/api/erp/sync', { method: 'POST' }); await refreshSync(); await refresh() }
  catch { actionError.value = 'Não foi possível atualizar os dados. A versão anterior foi preservada.'; await refreshSync() }
  finally { syncing.value = false }
}
async function savePolicy(policy: Policy) {
  if (!canEdit.value || saving.value || !editing.value
    || policy.productId !== editing.value.product.id || policy.storeId !== editing.value.product.storeId) return
  saving.value = true; policyError.value = ''
  try { await $fetch(`/api/replenishment/policies/${encodeURIComponent(policy.productId)}`, { method: 'PUT', body: policy }); editing.value = null; await refresh() }
  catch { policyError.value = 'Não foi possível salvar os parâmetros. Confira a versão e tente novamente.' }
  finally { saving.value = false }
}
async function review() {
  if (!selected.value.length || !published.value?.snapshotId || !canEdit.value) return
  await navigateTo({ path: '/purchase-drafts', query: { snapshot: published.value.snapshotId, items: JSON.stringify(selected.value) } })
}
</script>

<template>
  <AppShell :user="auth.user.value" active="replenishment" @logout="auth.logout">
    <div class="replenishment-page">
      <header class="admin-page-heading"><div><p class="admin-kicker">COMPRADOR VIRTUAL</p><h1>Reposição</h1><p>Vendas totais e sugestões explicáveis para sua revisão.</p></div><NuxtLink to="/purchase-drafts">Rodadas locais</NuxtLink></header>
      <ErpSyncStatus :status="sync?.status ?? null" :snapshot="sync?.snapshot" :configured="sync?.configured" :can-sync="canEdit" :pending="syncing" :error="actionError || (syncLoadError ? 'Não foi possível consultar a sincronização.' : '')" @sync="update" />
      <ReplenishmentIssues :issues="published?.issues ?? []" />
      <ReplenishmentList :items="published?.items ?? []" :can-select="canEdit" :error="loadError ? 'Não foi possível consultar as recomendações.' : ''" @retry="refresh()" @selection="selected = $event" @policy="openPolicy" />
      <button v-if="canEdit" type="button" :disabled="!selected.length || !published?.snapshotId" @click="review">Revisar {{ selected.length }} itens em rodada local</button>
      <UModal v-model:open="policyOpen" title="Parâmetros de compra" :description="editing ? `${editing.product.description} · SKU ${editing.product.id} · Loja ${editing.product.storeId}` : ''" :dismissible="!saving" :content="{ onOpenAutoFocus: focusPolicyEditor, onCloseAutoFocus: restorePolicyTrigger }" :ui="{ content: 'max-w-2xl rounded-3xl' }">
        <template #close><UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Fechar parâmetros de compra" :disabled="saving" class="absolute top-4 end-4 min-h-12 min-w-12" @click="closePolicy" /></template>
        <template #body>
          <div v-if="editing" class="replenishment-page">
            <ReplenishmentPolicyEditor :key="`${editing.product.id}/${editing.product.storeId}`" ref="policyEditor" :product-id="editing.product.id" :store-id="editing.product.storeId" :policy="editing.policy" :can-edit="canEdit" :pending="saving" :error="policyError" @save="savePolicy" @cancel="closePolicy" />
          </div>
        </template>
      </UModal>
    </div>
  </AppShell>
</template>

<style src="../assets/css/replenishment.css"></style>
