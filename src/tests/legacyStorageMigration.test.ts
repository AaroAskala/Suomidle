import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ensureLegacyStorageMigrated, MIGRATION_STATE_KEY } from '../utils/legacyStorageMigration'

const RESPONSE_TYPE = 'suomidle-legacy-migration-response-v1'
const IFRAME_SELECTOR = 'iframe[data-suomidle-migration-proxy]'
const nextTick = () => Promise.resolve()

describe('legacy storage migration', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = '<div id="root"></div>'
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('imports save data from the legacy origin when available', async () => {
    const migration = ensureLegacyStorageMigrated({
      force: true,
      requestIdOverride: 'request-123',
      requestTimeoutMs: 250,
    })

    await nextTick()

    expect(document.querySelector(IFRAME_SELECTOR)).not.toBeNull()

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://aaroaskala.github.io',
        data: {
          type: RESPONSE_TYPE,
          requestId: 'request-123',
          status: 'ok',
          payload: {
            suomidle: '{"legacy":true}',
            settings: '{"volume":0.5}',
          },
        },
      }),
    )

    await migration

    expect(localStorage.getItem('suomidle')).toBe('{"legacy":true}')
    expect(localStorage.getItem('settings')).toBe('{"volume":0.5}')
    expect(localStorage.getItem(MIGRATION_STATE_KEY)).toBe('complete')
    expect(document.querySelector(IFRAME_SELECTOR)).toBeNull()
  })

  test('overwrites an existing save with the legacy data exactly once', async () => {
    localStorage.setItem('suomidle', '{"fresh":true}')
    localStorage.setItem('settings', '{"volume":1}')

    const migration = ensureLegacyStorageMigrated({
      force: true,
      requestIdOverride: 'force-test',
      requestTimeoutMs: 250,
    })

    await nextTick()

    expect(document.querySelector(IFRAME_SELECTOR)).not.toBeNull()

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://aaroaskala.github.io',
        data: {
          type: RESPONSE_TYPE,
          requestId: 'force-test',
          status: 'ok',
          payload: {
            suomidle: '{"legacy":true}',
            settings: '{"volume":0.4}',
          },
        },
      }),
    )

    await migration

    expect(localStorage.getItem('suomidle')).toBe('{"legacy":true}')
    expect(localStorage.getItem('settings')).toBe('{"volume":0.4}')
    expect(localStorage.getItem(MIGRATION_STATE_KEY)).toBe('complete')
    expect(document.querySelector(IFRAME_SELECTOR)).toBeNull()

    await ensureLegacyStorageMigrated({ hostnameOverride: 'aaroonparas.com' })

    expect(document.querySelector(IFRAME_SELECTOR)).toBeNull()
    expect(localStorage.getItem('suomidle')).toBe('{"legacy":true}')
    expect(localStorage.getItem(MIGRATION_STATE_KEY)).toBe('complete')
  })

  test('resolves after timing out when the legacy origin is unreachable', async () => {
    vi.useFakeTimers()

    const migration = ensureLegacyStorageMigrated({
      force: true,
      requestIdOverride: 'timeout',
      requestTimeoutMs: 10,
    })

    await nextTick()

    await vi.advanceTimersByTimeAsync(20)

    await migration

    expect(localStorage.getItem('suomidle')).toBeNull()
    expect(localStorage.getItem(MIGRATION_STATE_KEY)).toBeNull()
    expect(document.querySelector(IFRAME_SELECTOR)).toBeNull()
  })
})
