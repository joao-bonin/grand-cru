import { defineConfig } from '@playwright/test'

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
