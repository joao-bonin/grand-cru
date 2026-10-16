import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.vue', 'app/**/*.ts', 'server/**/*.ts'],
    },
  },
})
