/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
declare const process: { env?: Record<string, string | undefined> }

const envBase = process?.env?.VITE_BASE ?? process?.env?.BASE_URL ?? '/'
const base = envBase.endsWith('/') ? envBase : `${envBase}/`

const commitSha =
  process?.env?.VERCEL_GIT_COMMIT_SHA ??
  process?.env?.GITHUB_SHA ??
  process?.env?.COMMIT_SHA ??
  process?.env?.GIT_COMMIT ??
  process?.env?.CI_COMMIT_SHA ??
  process?.env?.BUILD_SOURCEVERSION

const packageVersion = process?.env?.npm_package_version

const appVersion = commitSha ?? packageVersion ?? 'dev'
const buildTime = new Date().toISOString()

const versionAssetName = 'app-version.json'
const versionPayload = JSON.stringify({ version: appVersion, buildTime })

const normalizeBasePath = (value: string) => {
  if (/^[a-z]+:\/\//i.test(value)) {
    const protocolEnd = value.indexOf('://') + 3
    const pathStart = value.indexOf('/', protocolEnd)
    const rawPath = pathStart >= 0 ? value.slice(pathStart) : '/'
    const cleanPath = rawPath.split(/[?#]/)[0] || '/'
    return cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`
  }
  const withTrailingSlash = value.endsWith('/') ? value : `${value}/`
  return withTrailingSlash.startsWith('/') ? withTrailingSlash : `/${withTrailingSlash}`
}

const basePathForRequests = normalizeBasePath(base)

const versionPaths = new Set<string>([
  `/${versionAssetName}`,
  `${basePathForRequests}${versionAssetName}`,
])

const versionPlugin: Plugin = {
  name: 'suomidle-app-version',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = (req as { url?: string }).url ?? ''
      const requestPath = rawUrl.split('?')[0]
      if (!requestPath || !versionPaths.has(requestPath)) {
        next()
        return
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(versionPayload)
    })
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: versionAssetName,
      source: `${versionPayload}\n`,
    })
  },
}

export default defineConfig({
  plugins: [react(), versionPlugin],
  base,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  // @ts-expect-error - Vitest config
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
