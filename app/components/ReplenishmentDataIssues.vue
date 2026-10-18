<script setup lang="ts">
import { computed } from 'vue'
import { summarizeReplenishmentIssues } from '#shared/application/replenishment-issues'
const props = defineProps<{ issues: string[] }>()
const summary = computed(() => summarizeReplenishmentIssues(props.issues))
</script>

<template>
  <section v-if="summary.length" class="dashboard-card replenishment-data-issues" aria-label="Limitações dos dados">
    <details>
      <summary>Dados que precisam de atenção</summary>
      <p>As sugestões afetadas ficam bloqueadas até a conferência dos dados.</p>
      <ul><li v-for="issue in summary" :key="issue">{{ issue }}</li></ul>
      <p>Consulte a visão Pendências para conferir cada produto.</p>
    </details>
  </section>
</template>
