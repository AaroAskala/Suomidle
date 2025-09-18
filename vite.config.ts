/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
declare const process: { env?: Record<string, string | undefined> }

const envBase = process?.env?.VITE_BASE ?? process?.env?.BASE_URL ?? '/'
const base = envBase.endsWith('/') ? envBase : `${envBase}/`

export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ['importAttributes', 'deprecatedImportAssert'],
        },
      },
    }),
  ],
  base,
  // @ts-expect-error - Vitest config
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
