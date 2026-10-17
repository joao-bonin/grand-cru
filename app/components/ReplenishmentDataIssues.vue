<script setup lang="ts">
import { computed } from 'vue'
import { summarizeReplenishmentIssues } from '../../shared/application/replenishment-issues'
const props = defineProps<{ issues: string[] }>()
const summary = computed(() => summarizeReplenishmentIssues(props.issues))
</script>

<template>
  <section v-if="summary.length" class="dashboard-card replenishment-data-issues" aria-label="Limitações dos dados">
    <h2>Dados que precisam de atenção</h2>
    <p>As sugestões dependentes permanecem indisponíveis até que os dados sejam comprovados.</p>
    <ul><li v-for="issue in summary" :key="issue">{{ issue }}</li></ul>
    <p>Busque pelo SKU e abra “Ver justificativa e pendências” para conferir cada produto. O ERP permanece somente leitura.</p>
  </section>
</template>
