<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Policy, Recommendation, RecommendationFilters, RecommendationPage, SyncStatus } from '../../shared/types/replenishment'
definePageMeta({ middleware: ['auth'] })
const auth = useAuth()
const canEdit = computed(() => auth.user.value?.role === 'admin')
const { data: sync, error: syncLoadError, refresh: refreshSync } = await useFetch<{ status: SyncStatus, snapshot: { id: string, createdAt: string } | null, configured: boolean }>('/api/erp/status')
const start = ref(0)
const filters = ref<RecommendationFilters>({ product: '', supplier: '', issues: false, risk: false })
const query = computed(() => ({ start: start.value, count: 20, product: filters.value.product || undefined, supplier: filters.value.supplier || undefined, issues: filters.value.issues ? 'true' : undefined, risk: filters.value.risk ? 'true' : undefined }))
const { data, error: loadError, pending: loading, refresh } = await useFetch<RecommendationPage>('/api/replenishment', { query })
// Keep the last published response visible when a later request fails.
const published = ref(data.value)
watch(data, value => {
  if (!value || loadError.value) return
  if (value.start > 0 && value.start >= value.total) { start.value = Math.floor(Math.max(0, value.total - 1) / 20) * 20; return }
  published.value = value
})
const selected = ref<Array<{ productId: string, storeId: string }>>([])
const editing = ref<Recommendation | null>(null)
const syncing = ref(false); const saving = ref(false); const actionError = ref(''); const policyError = ref('')
function changePage(value: number) { start.value = value; selected.value = [] }
function changeFilters(value: RecommendationFilters) { filters.value = value; changePage(0) }
async function update() {
  if (!canEdit.value || syncing.value) return
  syncing.value = true; actionError.value = ''
  try { await $fetch('/api/erp/sync', { method: 'POST' }); await refreshSync(); await refresh() }
  catch { actionError.value = 'Não foi possível atualizar os dados. A versão anterior foi preservada.'; await refreshSync() }
  finally { syncing.value = false }
}
async function savePolicy(policy: Policy) {
  if (!canEdit.value) return
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
      <ul v-if="published?.issues.length" class="dashboard-card" aria-label="Limitações dos dados"><li v-for="issue in published.issues" :key="issue">{{ issue }}</li></ul>
      <ReplenishmentPolicyEditor v-if="editing" :key="`${editing.product.id}/${editing.product.storeId}`" :product-id="editing.product.id" :store-id="editing.product.storeId" :policy="editing.policy" :can-edit="canEdit" :pending="saving" :error="policyError" @save="savePolicy" />
      <ReplenishmentList :items="published?.items ?? []" :pagination="{ start: published?.start ?? 0, count: 20, total: published?.total ?? published?.items.length ?? 0, supplierIds: published?.supplierIds ?? [] }" :loading="loading" :can-select="canEdit" :error="loadError ? 'Não foi possível consultar as recomendações.' : ''" @page="changePage" @filters="changeFilters" @retry="refresh()" @selection="selected = $event" @policy="editing = $event" />
      <button v-if="canEdit" type="button" :disabled="loading || !selected.length || !published?.snapshotId" @click="review">Revisar {{ selected.length }} itens em rodada local</button>
    </div>
  </AppShell>
</template>

<style src="../assets/css/replenishment.css"></style>
