<script setup lang="ts">
import { describeReplenishmentIssue } from '#shared/application/replenishment-issues'
import type { Recommendation } from '../../shared/types/replenishment'
defineProps<{ item: Recommendation }>()
function units(value: number | null) { return value === null ? 'Indisponível' : `${Number(value.toFixed(3))} unidades` }
</script>

<template>
  <section class="replenishment-explanation" :aria-label="`Memória de cálculo de ${item.product.description}`">
    <h3>Por que esta sugestão?</h3>
    <p>Fonte: versão {{ item.snapshotId }} do ERP. Parâmetros de compra configurados localmente.</p>
    <p>Vendas totais, incluindo os canais disponíveis.</p>
    <ul><li v-for="(sale, days) in item.sales" :key="days">{{ days }} dias: {{ units(sale.quantity) }}{{ sale.partial ? ' · histórico parcial' : '' }}</li></ul>
    <dl>
      <dt>Janela usada</dt><dd>{{ item.policy ? `${item.policy.windowDays} dias` : 'Indisponível' }}</dd>
      <dt>Consumo diário</dt><dd>{{ units(item.dailyDemand) }}</dd>
      <dt>Prazo do fornecedor</dt><dd>{{ item.policy?.leadDays ?? 'Indisponível' }} dias</dd>
      <dt>Intervalo de revisão</dt><dd>{{ item.policy?.reviewDays ?? 'Indisponível' }} dias</dd>
      <dt>Segurança</dt><dd>{{ units(item.policy?.safetyUnits ?? null) }}</dd>
      <dt>Mínimo</dt><dd>{{ units(item.policy?.minimum ?? null) }}</dd>
      <dt>Estoque disponível</dt><dd data-field="available">{{ units(item.available) }}</dd>
      <dt>Compras pendentes</dt><dd data-field="pending">{{ units(item.pending) }}</dd>
      <dt>Estoque alvo</dt><dd data-field="target">{{ units(item.target) }}</dd>
      <dt>Necessidade bruta</dt><dd>{{ units(item.raw) }}</dd>
      <dt>Múltiplo da embalagem</dt><dd>{{ units(item.policy?.packSize ?? null) }}</dd>
      <dt>Sugestão arredondada</dt><dd data-field="suggested">{{ units(item.suggested) }}{{ item.suggested === null || item.packages === null ? '' : ` · ${item.packages} embalagens` }}</dd>
      <dt>Excedente do arredondamento</dt><dd>{{ units(item.excess) }}</dd>
      <dt>Cobertura</dt><dd>{{ item.coverageDays === null ? 'Indisponível' : `${item.coverageDays.toFixed(1)} dias` }}</dd>
      <dt>Primeira insuficiência projetada</dt><dd>{{ item.ruptureDate ?? 'Não identificada' }}</dd>
      <dt>Giro de estoque</dt><dd>{{ item.turnover === null ? 'Giro indisponível: histórico de saldos insuficiente.' : item.turnover }}</dd>
    </dl>
    <ul v-if="item.issues.length" aria-label="Pendências"><li v-for="issue in item.issues" :key="issue">{{ describeReplenishmentIssue(issue) }}</li></ul>
  </section>
</template>
