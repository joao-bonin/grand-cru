<script setup lang="ts">
defineProps<{ pending: boolean, error: string }>()
const emit = defineEmits<{ submit: [login: string, password: string] }>()
const login = ref('')
const password = ref('')
const visible = ref(false)
</script>

<template>
  <form class="login-form" @submit.prevent="emit('submit', login, password)">
    <UAlert v-if="error" color="error" variant="soft" :title="error" role="alert" />
    <UFormField label="Login" name="login">
      <UInput id="login" v-model="login" class="w-full" size="xl" placeholder="Seu login" autocomplete="username" required maxlength="100" :disabled="pending" />
    </UFormField>
    <UFormField label="Senha" name="password">
      <UInput id="password" v-model="password" class="w-full" size="xl" :type="visible ? 'text' : 'password'" placeholder="Sua senha" autocomplete="current-password" required maxlength="128" :disabled="pending" />
      <template #hint>
        <button class="password-toggle" type="button" :aria-pressed="visible" :disabled="pending" @click="visible = !visible">
          {{ visible ? 'Ocultar senha' : 'Mostrar senha' }}
        </button>
      </template>
    </UFormField>
    <UButton class="login-submit" type="submit" size="xl" block :loading="pending" :disabled="pending">
      {{ pending ? 'Entrando…' : 'Entrar' }}
      <span v-if="!pending" aria-hidden="true">→</span>
    </UButton>
  </form>
</template>
