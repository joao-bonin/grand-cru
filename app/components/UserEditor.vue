<script setup lang="ts">
import type { PublicUser, UserRole } from '../../shared/types/user'
const props = defineProps<{ user?: PublicUser, pending: boolean, error: string }>()
const emit = defineEmits<{ save: [data: { login: string, password?: string, role: UserRole, active: boolean }], cancel: [] }>()
const login = ref(props.user?.login ?? '')
const password = ref('')
const role = ref<UserRole>(props.user?.role ?? 'user')
const active = ref(props.user?.active ?? true)
function submit() { emit('save', { login: login.value, ...(password.value ? { password: password.value } : {}), role: role.value, active: active.value }) }
</script>

<template>
  <form class="user-editor" @submit.prevent="submit">
    <h2>{{ user ? 'Editar usuário' : 'Novo usuário' }}</h2>
    <UAlert v-if="error" color="error" :title="error" role="alert" />
    <UFormField label="Login"><UInput v-model="login" class="w-full" required minlength="3" maxlength="100" autocomplete="off" :disabled="pending" /></UFormField>
    <UFormField :label="user ? 'Nova senha (opcional)' : 'Senha'" help="Use pelo menos 12 caracteres.">
      <UInput v-model="password" class="w-full" type="password" :required="!user" minlength="12" maxlength="128" autocomplete="new-password" :disabled="pending" />
    </UFormField>
    <UFormField label="Perfil"><USelect v-model="role" class="w-full" :items="[{ label: 'Usuário', value: 'user' }, { label: 'Administrador', value: 'admin' }]" :disabled="pending" /></UFormField>
    <UCheckbox v-model="active" label="Usuário ativo" :disabled="pending" />
    <div class="editor-actions"><UButton type="submit" :loading="pending" :disabled="pending">Salvar usuário</UButton><UButton color="neutral" variant="outline" :disabled="pending" @click="emit('cancel')">Cancelar</UButton></div>
  </form>
</template>
