<script setup lang="ts">
import { computed } from 'vue'
import type { Recommendation } from '../../shared/types/replenishment'
import { recommendationSelectionIssues } from '#shared/application/replenishment-selection'
import { summarizeReplenishmentIssues } from '#shared/presentation/replenishment-issues'
import ReplenishmentIssues from './ReplenishmentIssues.vue'
const props = defineProps<{ item: Recommendation, descriptionId: string }>()
const issues = computed(() => recommendationSelectionIssues(props.item))
const notices = computed(() => summarizeReplenishmentIssues(issues.value))
</script>

<template>
  <div v-if="notices.length" class="replenishment-selection-help">
    <p :id="descriptionId"><strong>Seleção indisponível:</strong> {{ notices[0]?.title }}<span v-if="notices.length > 1"> · mais {{ notices.length - 1 }} {{ notices.length === 2 ? 'pendência' : 'pendências' }}</span></p>
    <details><summary>Por que não posso selecionar?</summary><ReplenishmentIssues :issues="issues" compact /></details>
  </div>
</template>
