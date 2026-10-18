<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { getReplenishmentGuidance } from '#shared/application/replenishment-guidance'
import type { Recommendation } from '../../shared/types/replenishment'

const props = defineProps<{ item: Recommendation, pending?: boolean }>()
const emit = defineEmits<{ configure: [] }>()
const expanded = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const helpId = useId()
const groups = computed(() => getReplenishmentGuidance(props.item))
function close() { expanded.value = false; trigger.value?.focus() }
function configure() { close(); emit('configure') }
watch(expanded, (value, _previous, onCleanup) => {
  if (!value) return
  const outside = (event: PointerEvent) => {
    if (event.target instanceof Node && !root.value?.contains(event.target)) expanded.value = false
  }
  document.addEventListener('pointerdown', outside)
  onCleanup(() => document.removeEventListener('pointerdown', outside))
})
</script>

<template>
  <span ref="root" class="replenishment-selection-help" @keydown.esc.stop.prevent="close">
    <button ref="trigger" type="button" class="replenishment-help-trigger" :aria-label="`Por que não posso selecionar ${item.product.description}?`" :aria-expanded="expanded" :aria-controls="`${helpId}-panel`" @click="expanded = !expanded">?</button>
    <span v-if="expanded" :id="`${helpId}-panel`" class="replenishment-help-panel" role="region" :aria-labelledby="`${helpId}-title`">
      <strong :id="`${helpId}-title`">Por que não posso selecionar?</strong>
      <span v-if="pending">Aguarde o carregamento terminar para selecionar o produto.</span>
      <span v-else-if="!item.issues.length && item.suggested === 0">A sugestão atual é de zero unidades. Não há compra sugerida para este produto.</span>
      <template v-else>
        <span>A seleção exige uma sugestão disponível, maior que zero e sem pendências.</span>
        <span v-for="group in groups" :key="group.source" class="replenishment-help-group" :data-source="group.source">
          <strong>{{ group.title }}</strong>
          <span>{{ group.action }}</span>
          <span v-for="issue in group.issues" :key="issue" class="replenishment-help-issue">{{ issue }}</span>
          <span v-for="check in group.checks" :key="check">• {{ check }}</span>
          <template v-if="group.source === 'local'">
            <span>O custo por unidade é opcional. Salvar os parâmetros não remove pendências da integração.</span>
            <button type="button" @click="configure">Abrir parâmetros de compra</button>
          </template>
        </span>
        <span v-if="!groups.length">A sugestão ainda está indisponível. Peça ao administrador para conferir os dados e a atualização.</span>
      </template>
      <button type="button" class="replenishment-help-close" @click="close">Fechar</button>
    </span>
  </span>
</template>
