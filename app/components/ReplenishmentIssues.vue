<script setup lang="ts">
import { computed } from 'vue'
import { summarizeReplenishmentIssues } from '#shared/presentation/replenishment-issues'
const props = defineProps<{ issues: string[], compact?: boolean }>()
const notices = computed(() => summarizeReplenishmentIssues(props.issues))
</script>

<template>
  <section v-if="notices.length" class="replenishment-issues" :class="{ 'dashboard-card': !compact }" aria-label="Pendências dos dados">
    <h2 v-if="!compact">Alguns dados precisam de revisão</h2>
    <ul><li v-for="notice in notices" :key="notice.key"><strong>{{ notice.title }}</strong><p v-if="notice.description">{{ notice.description }}</p></li></ul>
  </section>
</template>
