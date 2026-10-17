export default defineNuxtConfig({
  compatibilityDate: '2026-10-14',
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  css: ['~/assets/css/main.css', '~/assets/css/dashboard.css'],
  devtools: { enabled: false },
  typescript: { strict: true },
  nitro: { vercel: { functions: { maxDuration: 300 } } },
  runtimeConfig: { databaseUrl: '', jwtSecret: '' },
  ui: { fonts: false },
  app: {
    head: {
      title: 'Grand Cru',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [{ name: 'description', content: 'Grand Cru — dashboards e análise de dados do ERP.' }],
    },
  },
})
