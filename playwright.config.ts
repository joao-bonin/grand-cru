import { defineConfig } from '@playwright/test'

if (['ERP_ACCESS_TOKEN', 'ERP_USERNAME', 'ERP_PASSWORD', 'ERP_TOKEN_ENCRYPTION_KEY', 'ERP_STORE_ID'].some(name => process.env[name])) {
  throw new Error('Testes de integração exigem configuração ERP vazia; use somente mocks e credenciais sintéticas injetadas.')
}

export default defineConfig({
  testDir: './tests/integration',
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'off',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
})
