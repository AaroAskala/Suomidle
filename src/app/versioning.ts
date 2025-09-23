export interface AppVersionMetadata {
  version?: unknown
  buildTime?: unknown
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const CURRENT_APP_VERSION =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : ''

export const CURRENT_APP_BUILD_TIME =
  typeof __APP_BUILD_TIME__ === 'string' ? __APP_BUILD_TIME__ : ''

export const isUpdateAvailable = (
  metadata: AppVersionMetadata | null | undefined,
  currentVersion: string = CURRENT_APP_VERSION,
  currentBuildTime: string = CURRENT_APP_BUILD_TIME,
): boolean => {
  if (!metadata) return false

  const remoteVersion = isNonEmptyString(metadata.version) ? metadata.version : ''
  const remoteBuildTime = isNonEmptyString(metadata.buildTime) ? metadata.buildTime : ''
  const localVersion = isNonEmptyString(currentVersion) ? currentVersion : ''
  const localBuildTime = isNonEmptyString(currentBuildTime) ? currentBuildTime : ''

  const hasVersionMismatch =
    remoteVersion.length > 0 && localVersion.length > 0 && remoteVersion !== localVersion

  if (hasVersionMismatch) return true

  const hasBuildTimeMismatch =
    remoteBuildTime.length > 0 && localBuildTime.length > 0 && remoteBuildTime !== localBuildTime

  return hasBuildTimeMismatch
}

export const buildVersionCheckUrl = () => {
  const baseUrl = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  if (/^[a-z]+:\/\//i.test(normalizedBase)) {
    const protocolEnd = normalizedBase.indexOf('://') + 3
    const pathStart = normalizedBase.indexOf('/', protocolEnd)
    const rawPath = pathStart >= 0 ? normalizedBase.slice(pathStart) : '/'
    const cleanPath = rawPath.split(/[?#]/)[0] || '/'
    const ensured = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`
    return `${ensured}app-version.json`
  }
  if (normalizedBase.startsWith('/')) {
    return `${normalizedBase}app-version.json`
  }
  return `/${normalizedBase}app-version.json`
}
