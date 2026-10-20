<script setup lang="ts">
const auth = useAuth()
const pending = ref(false)
const error = ref('')

async function submit(login: string, password: string) {
  pending.value = true
  error.value = ''
  try {
    await auth.login(login, password)
    await navigateTo('/dashboard')
  } catch (cause) {
    const status = (cause as { statusCode?: number }).statusCode
    error.value = status === 401 ? 'Login ou senha inválidos.'
      : status === 429 ? 'Muitas tentativas. Aguarde 15 minutos e tente novamente.'
        : 'Não foi possível entrar. Verifique os dados ou tente novamente mais tarde.'
  } finally { pending.value = false }
}
</script>

<template>
  <main class="login-layout">
    <aside class="login-story" aria-label="Grand Cru">
      <div class="brand"><span class="brand-mark" aria-hidden="true">G.</span><span>GRAND CRU</span></div>
      <div class="story-copy">
        <p class="story-label">UMA NOVA PERSPECTIVA</p>
        <h1>Grandes decisões<br>começam com<br><em>clareza.</em></h1>
        <p>Os dados do seu negócio, reunidos em um só lugar.<br>Mais contexto para cada próximo passo.</p>
      </div>
      <div class="vineyard" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <p class="story-footer">DADOS QUE FAZEM SENTIDO.</p>
    </aside>
    <section class="login-panel" aria-labelledby="login-heading">
      <div class="mobile-brand"><span class="brand-mark" aria-hidden="true">G.</span><span>GRAND CRU</span></div>
      <div class="login-card">
        <p class="login-kicker">SEU ESPAÇO DE ANÁLISE</p>
        <h2 id="login-heading">Bem-vindo de volta.</h2>
        <p class="login-description">Entre para acompanhar seu negócio.</p>
        <LoginForm :pending="pending" :error="error" @submit="submit" />
        <p class="access-help">Precisa de acesso? Fale com o administrador.</p>
        <div class="security-note">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
          <span>Acesso protegido. Seus dados em boas mãos.</span>
        </div>
      </div>
      <footer class="login-footer">Grand Cru <span>•</span> Inteligência para o seu negócio</footer>
    </section>
  </main>
</template>
