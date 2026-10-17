<script setup lang="ts">
import { ref } from 'vue'
import type { PublicUser, UserRole } from '../../shared/types/user'
const props = defineProps<{ user?: PublicUser, pending: boolean, error: string }>()
const emit = defineEmits<{ save: [data: { login: string, password?: string, role: UserRole, active: boolean }], cancel: [] }>()
const login = ref(props.user?.login ?? '')
const password = ref('')
const role = ref<UserRole>(props.user?.role ?? 'user')
const active = ref(props.user?.active ?? true)
function submit() { if (props.pending) return; emit('save', { login: login.value, ...(password.value ? { password: password.value } : {}), role: role.value, active: active.value }) }
</script>

<template>
  <form class="user-editor" @submit.prevent="submit">
    <h2>{{ user ? 'Editar usuário' : 'Novo usuário' }}</h2>
    <UAlert v-if="error" color="error" :title="error" role="alert" />
    <fieldset class="user-editor-section user-editor-identity">
      <legend>Identificação e segurança</legend>
      <UFormField label="Login" help="Letras sem acento, números e . - _ @">
        <UInput v-model="login" name="login" class="w-full" :ui="{ base: 'user-editor-input' }" placeholder="ex.: maria.silva" required minlength="3" maxlength="100" autocomplete="off" :disabled="pending" />
      </UFormField>
      <UFormField :label="user ? 'Nova senha (opcional)' : 'Senha'" :help="user ? 'Deixe em branco para manter a senha atual. Use pelo menos 12 caracteres para alterá-la.' : 'Use pelo menos 12 caracteres.'">
        <UInput v-model="password" name="password" class="w-full" :ui="{ base: 'user-editor-input' }" type="password" :required="!user" minlength="12" maxlength="128" autocomplete="new-password" :disabled="pending" />
      </UFormField>
    </fieldset>
    <fieldset class="user-editor-section">
      <legend>Permissões e acesso</legend>
      <UFormField label="Perfil" :help="role === 'admin' ? 'Gerencia usuários e configura parâmetros locais do Grand Cru.' : 'Consulta as informações, sem gerenciar usuários ou parâmetros.'">
        <USelect v-model="role" class="w-full" :ui="{ base: 'user-editor-input' }" :items="[{ label: 'Usuário', value: 'user' }, { label: 'Administrador', value: 'admin' }]" :disabled="pending" />
      </UFormField>
      <div class="user-editor-access"><UCheckbox v-model="active" label="Usuário ativo" :disabled="pending" /><p>Contas inativas não podem entrar no aplicativo.</p></div>
    </fieldset>
    <p v-if="user" class="user-editor-note">Salvar alterações encerra as sessões anteriores desta conta.</p>
    <div class="editor-actions"><UButton class="wine-button" type="submit" :loading="pending" :disabled="pending">Salvar usuário</UButton><UButton color="neutral" variant="outline" :disabled="pending" @click="emit('cancel')">Cancelar</UButton></div>
  </form>
</template>
