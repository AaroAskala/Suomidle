import { describe, expect, it } from 'vitest'
import { isUpdateAvailable } from '../app/versioning'

describe('isUpdateAvailable', () => {
  it('returns false when metadata is null', () => {
    expect(isUpdateAvailable(null, '1.0.0', '2024-01-01T00:00:00.000Z')).toBe(false)
  })

  it('returns false when versions and build times match', () => {
    expect(
      isUpdateAvailable(
        { version: '1.0.0', buildTime: '2024-01-01T00:00:00.000Z' },
        '1.0.0',
        '2024-01-01T00:00:00.000Z',
      ),
    ).toBe(false)
  })

  it('returns true when versions differ', () => {
    expect(
      isUpdateAvailable(
        { version: '1.0.1', buildTime: '2024-01-02T00:00:00.000Z' },
        '1.0.0',
        '2024-01-01T00:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('returns true when build time differs and version is unknown', () => {
    expect(
      isUpdateAvailable(
        { buildTime: '2024-01-02T00:00:00.000Z' },
        '',
        '2024-01-01T00:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('returns false when metadata lacks identifiers', () => {
    expect(isUpdateAvailable({}, '', '')).toBe(false)
  })
})
