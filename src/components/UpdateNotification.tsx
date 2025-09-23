import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from '../i18n/useLocale'
import {
  buildVersionCheckUrl,
  isUpdateAvailable,
  type AppVersionMetadata,
} from '../app/versioning'

const CHECK_COOLDOWN_MS = 30_000

const fetchLatestVersion = async (): Promise<AppVersionMetadata | null> => {
  if (typeof fetch !== 'function') {
    console.warn('Global fetch is unavailable; skipping version check')
    return null
  }
  try {
    const response = await fetch(`${buildVersionCheckUrl()}?ts=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      console.warn('Version check failed with status', response.status)
      return null
    }
    const payload = (await response.json()) as unknown
    if (!payload || typeof payload !== 'object') {
      console.warn('Version metadata response was not an object')
      return null
    }
    return payload as AppVersionMetadata
  } catch (error) {
    console.warn('Failed to fetch version metadata', error)
    return null
  }
}

export function UpdateNotification() {
  const { t } = useLocale()
  const [updateReady, setUpdateReady] = useState(false)
  const lastCheckRef = useRef(-Infinity)
  const checkInFlightRef = useRef<Promise<void> | null>(null)

  const checkForUpdate = useCallback(async () => {
    if (updateReady) return
    if (checkInFlightRef.current) return

    const now = Date.now()
    if (now - lastCheckRef.current < CHECK_COOLDOWN_MS) {
      return
    }

    const request = (async () => {
      const metadata = await fetchLatestVersion()
      if (metadata && isUpdateAvailable(metadata)) {
        setUpdateReady(true)
      }
      lastCheckRef.current = Date.now()
    })()

    checkInFlightRef.current = request

    try {
      await request
    } finally {
      checkInFlightRef.current = null
    }
  }, [updateReady])

  useEffect(() => {
    if (updateReady) return
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }
    const handleInteraction = () => {
      void checkForUpdate()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate()
      }
    }

    window.addEventListener('pointerdown', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pointerdown', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkForUpdate, updateReady])

  const handleRefresh = useCallback(() => {
    try {
      window.location.reload()
    } catch (error) {
      console.error('Failed to reload the page', error)
    }
  }, [])

  if (!updateReady) {
    return null
  }

  return (
    <div className="update-notification" role="status" aria-live="polite">
      <div className="update-notification__content">
        <span className="update-notification__title">{t('app.updateAvailable.title')}</span>
        <span className="update-notification__description">
          {t('app.updateAvailable.message')}
        </span>
      </div>
      <button
        type="button"
        className="btn btn--primary update-notification__action"
        onClick={handleRefresh}
      >
        {t('app.updateAvailable.refresh')}
      </button>
    </div>
  )
}
