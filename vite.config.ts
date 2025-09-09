/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Suomidle/',
  // @ts-expect-error - Vitest config
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
