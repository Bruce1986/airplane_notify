import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpenSkyPolling } from './useOpenSkyPolling'
import type { ObservationSite } from '../lib/types'
import { buildStatesUrl } from '../lib/opensky'

describe('useOpenSkyPolling', () => {
  const site: ObservationSite = {
    name: 'Test Field',
    latitude: 25,
    longitude: 121,
    radius: 700,
    maxAltitude: 3000
  }

  const responsePayload = {
    time: 0,
    states: [
      [
        'abc123',
        'TEST123 ',
        null,
        null,
        null,
        site.longitude,
        site.latitude,
        850,
        null,
        90,
        90,
        null,
        null,
        900
      ]
    ]
  }

  let originalFetch: typeof fetch
  const fetchMock = vi.fn()

  beforeEach(() => {
    originalFetch = global.fetch
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => responsePayload
    } as Response)
    // @ts-expect-error allow overriding fetch for testing
    global.fetch = fetchMock
  })

  afterEach(() => {
    // @ts-expect-error restore original fetch reference
    global.fetch = originalFetch
    fetchMock.mockReset()
    vi.useRealTimers()
  })

  it('polls OpenSky and resolves pass events', async () => {
    function Harness() {
      const passEvents = useOpenSkyPolling({ site, intervalMs: 1000 })
      return (
        <>
          <span data-testid="plane-id">{passEvents[0]?.plane.id ?? 'none'}</span>
          <span data-testid="event-count">{passEvents.length}</span>
        </>
      )
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(screen.getByTestId('plane-id').textContent).toBe('abc123')
    })
    expect(screen.getByTestId('event-count').textContent).toBe('1')

    const expectedUrl = buildStatesUrl(site)
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({ cache: 'no-store' }))

    unmount()
  })

  it('polls OpenSky periodically', async () => {
    // Use real timers with a short interval; jsdom's timer mocks do not reliably
    // control window.setTimeout in this environment.
    function Harness() {
      const passEvents = useOpenSkyPolling({ site, intervalMs: 20 })
      return <span data-testid="event-count">{passEvents.length}</span>
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    unmount()
  })
})
