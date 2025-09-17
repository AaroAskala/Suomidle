const LEGACY_ORIGIN = 'https://aaroaskala.github.io'
const LEGACY_MIGRATION_PATH = '/Suomidle/migration-proxy.html'
const REQUEST_MESSAGE_TYPE = 'suomidle-legacy-migration-request-v1'
const RESPONSE_MESSAGE_TYPE = 'suomidle-legacy-migration-response-v1'
export const MIGRATION_STATE_KEY = 'suomidle:migration:v1'
const MIGRATION_STATE_VALUE = 'complete'
const GAME_STORAGE_KEY = 'suomidle'
const SETTINGS_STORAGE_KEY = 'settings'
const MIGRATION_SUPPORTED_HOSTS = new Set([
  'aaroonparas.com',
  'www.aaroonparas.com',
  'localhost',
  '127.0.0.1',
])
const DEFAULT_TIMEOUT_MS = 5000
const MIGRATION_IFRAME_ATTRIBUTE = 'data-suomidle-migration-proxy'

interface LegacyResponseMessage {
  type?: string
  requestId?: string
  status?: 'ok' | 'empty' | 'error'
  payload?: Record<string, unknown>
  error?: unknown
}

export interface LegacyMigrationOptions {
  /**
   * Forces a migration attempt regardless of hostname or previous state.
   * Primarily intended for testing.
   */
  force?: boolean
  /**
   * Overrides the timeout used for the migration request (defaults to 5 seconds).
   */
  requestTimeoutMs?: number
  /**
   * Overrides the generated request ID. Primarily intended for tests.
   */
  requestIdOverride?: string
  /**
   * Overrides the detected hostname. Primarily intended for tests.
   */
  hostnameOverride?: string
}

const hasWindowSupport = () => typeof window !== 'undefined'

const hasDocumentSupport = () => typeof document !== 'undefined'

const hasLocalStorageSupport = () => {
  if (!hasWindowSupport()) return false
  try {
    void window.localStorage
    return true
  } catch (error) {
    console.warn('Suomidle: localStorage is unavailable; skipping legacy migration.', error)
    return false
  }
}

const waitForBody = async () => {
  if (!hasDocumentSupport()) return
  if (document.body) return
  await new Promise<void>((resolve) => {
    window.addEventListener(
      'DOMContentLoaded',
      () => {
        resolve()
      },
      { once: true },
    )
  })
}

const writeLocalStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.error(`Suomidle: failed to persist migrated value for "${key}".`, error)
    return false
  }
}

const markMigrationComplete = () => {
  try {
    window.localStorage.setItem(MIGRATION_STATE_KEY, MIGRATION_STATE_VALUE)
  } catch (error) {
    console.warn('Suomidle: unable to persist legacy migration marker.', error)
  }
}

const hasMigrationCompleted = () => {
  try {
    return window.localStorage.getItem(MIGRATION_STATE_KEY) === MIGRATION_STATE_VALUE
  } catch (error) {
    console.warn('Suomidle: unable to read legacy migration marker.', error)
    return false
  }
}

const applyPayload = (payload: Record<string, unknown>): boolean => {
  let imported = false
  const keys = [GAME_STORAGE_KEY, SETTINGS_STORAGE_KEY]
  for (const key of keys) {
    const value = payload[key]
    if (typeof value !== 'string') continue
    const didWrite = writeLocalStorage(key, value)
    imported = imported || didWrite
  }
  return imported
}

const buildRequestId = () => {
  if (!hasWindowSupport()) return `${Date.now()}`
  const cryptoApi = window.crypto
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
  return Math.random().toString(36).slice(2)
}

const setMigrationFrameAttributes = (frame: HTMLIFrameElement) => {
  frame.setAttribute(MIGRATION_IFRAME_ATTRIBUTE, 'true')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.display = 'none'
  frame.tabIndex = -1
}

const resolveLegacyFrame = () =>
  document.querySelector(`iframe[${MIGRATION_IFRAME_ATTRIBUTE}]`) as HTMLIFrameElement | null

export const ensureLegacyStorageMigrated = async (
  options?: LegacyMigrationOptions,
): Promise<void> => {
  if (!hasWindowSupport() || !hasDocumentSupport()) return
  if (!hasLocalStorageSupport()) return
  const hostname = options?.hostnameOverride ?? window.location.hostname
  if (!options?.force && !MIGRATION_SUPPORTED_HOSTS.has(hostname)) return
  if (resolveLegacyFrame()) return
  if (!options?.force && hasMigrationCompleted()) return
  await waitForBody()
  const requestId = options?.requestIdOverride ?? buildRequestId()
  await new Promise<void>((resolve) => {
    let finished = false
    const frame = document.createElement('iframe')
    setMigrationFrameAttributes(frame)
    const timeoutController = { id: 0 }
    const cleanup = (markComplete: boolean) => {
      if (finished) return
      finished = true
      window.clearTimeout(timeoutController.id)
      window.removeEventListener('message', handleMessage)
      frame.remove()
      if (markComplete) {
        markMigrationComplete()
        console.info('Suomidle: migrated legacy save data from GitHub Pages origin.')
      }
      resolve()
    }
    const handleMessage = (event: MessageEvent<LegacyResponseMessage>) => {
      if (event.origin !== LEGACY_ORIGIN) return
      const message = event.data
      if (!message || message.type !== RESPONSE_MESSAGE_TYPE) return
      if (message.requestId && message.requestId !== requestId) return
      if (message.status === 'error') {
        if (message.error) {
          console.error('Suomidle: legacy migration failed on remote origin.', message.error)
        }
        cleanup(false)
        return
      }
      const payload = message.payload
      const imported = payload && typeof payload === 'object' ? applyPayload(payload) : false
      const shouldMarkComplete = imported || message.status === 'empty'
      cleanup(shouldMarkComplete)
    }
    window.addEventListener('message', handleMessage)
    frame.addEventListener(
      'load',
      () => {
        const target = frame.contentWindow
        if (!target) {
          console.warn('Suomidle: legacy migration iframe has no contentWindow; aborting.')
          cleanup(false)
          return
        }
        try {
          target.postMessage(
            {
              type: REQUEST_MESSAGE_TYPE,
              requestId,
            },
            LEGACY_ORIGIN,
          )
        } catch (error) {
          console.error('Suomidle: failed to request legacy save data.', error)
          cleanup(false)
        }
      },
      { once: true },
    )
    const timeout = options?.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS
    timeoutController.id = window.setTimeout(() => {
      console.warn('Suomidle: timed out while waiting for legacy save data.')
      cleanup(false)
    }, timeout)
    frame.src = `${LEGACY_ORIGIN}${LEGACY_MIGRATION_PATH}`
    document.body.append(frame)
  })
}

