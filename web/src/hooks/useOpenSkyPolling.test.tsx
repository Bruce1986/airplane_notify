import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpenSkyPolling, __testables } from './useOpenSkyPolling'
import type { ObservationSite } from '../lib/types'
import { buildStatesUrl, OpenSkyRateLimitError } from '../lib/opensky'

describe('useOpenSkyPolling', () => {
  const site: ObservationSite = {
    name: 'Test Field',
    latitude: 25,
    longitude: 121,
    radius: 25_000,
    maxAltitude: 6000
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
      json: async () => responsePayload,
      headers: new Headers()
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
      const { passEvents, error } = useOpenSkyPolling({ site, intervalMs: 1000 })
      return (
        <>
          <span data-testid="plane-id">{passEvents[0]?.plane.id ?? 'none'}</span>
          <span data-testid="event-count">{passEvents.length}</span>
          <span data-testid="error">{error ? error.message : 'none'}</span>
        </>
      )
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(screen.getByTestId('plane-id').textContent).toBe('abc123')
    })
    expect(screen.getByTestId('event-count').textContent).toBe('1')
    expect(screen.getByTestId('error').textContent).toBe('none')

    const expectedUrl = buildStatesUrl(site)
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({ cache: 'no-store' }))

    unmount()
  })

  it('polls OpenSky periodically', async () => {
    // Use real timers with a short interval; jsdom's timer mocks do not reliably
    // control window.setTimeout in this environment.
    function Harness() {
      const { passEvents } = useOpenSkyPolling({ site, intervalMs: 20 })
      return <span data-testid="event-count">{passEvents.length}</span>
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(
      () => {
        expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
      },
      { timeout: 3000 }
    )

    unmount()
  })

  it('exposes polling errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503
    } as Response)

    function Harness() {
      const { error, passEvents } = useOpenSkyPolling({ site, intervalMs: 1000 })
      return (
        <>
          <span data-testid="error">{error ? error.message : 'none'}</span>
          <span data-testid="event-count">{passEvents.length}</span>
        </>
      )
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain('OpenSky request failed')
    })
    expect(screen.getByTestId('event-count').textContent).toBe('0')

    unmount()
  })

  it('backs off when hitting OpenSky rate limits', async () => {
    const rateLimitResponse = new Response(null, {
      status: 429,
      headers: { 'Retry-After': '15' }
    })

    fetchMock.mockResolvedValueOnce(rateLimitResponse)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
      headers: new Headers()
    } as Response)

    function Harness() {
      const { error, passEvents } = useOpenSkyPolling({ site, intervalMs: 1000 })
      return (
        <>
          <span data-testid="error">{error ? error.message : 'none'}</span>
          <span data-testid="event-count">{passEvents.length}</span>
        </>
      )
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain('頻率限制')
      expect(screen.getByTestId('error').textContent).toContain('60 秒後')
      expect(screen.getByTestId('event-count').textContent).toBe('0')
    })

    unmount()
  })

  it('parses Retry-After date headers when backing off', async () => {
    const now = Date.parse('2024-01-01T00:00:00Z')
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now)
    const retryAfterDate = new Date(now + 90_000).toUTCString()

    const rateLimitResponse = new Response(null, {
      status: 429,
      headers: { 'Retry-After': retryAfterDate }
    })

    fetchMock.mockResolvedValueOnce(rateLimitResponse)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
      headers: new Headers()
    } as Response)

    function Harness() {
      const { error, passEvents } = useOpenSkyPolling({ site, intervalMs: 1000 })
      return (
        <>
          <span data-testid="error">{error ? error.message : 'none'}</span>
          <span data-testid="event-count">{passEvents.length}</span>
        </>
      )
    }

    const { unmount } = render(<Harness />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toContain('頻率限制')
      expect(screen.getByTestId('error').textContent).toContain('90 秒後')
      expect(screen.getByTestId('event-count').textContent).toBe('0')
    })

    dateNowSpy.mockRestore()
    unmount()
  })

  it('calculates the next interval based on error type', () => {
    const { resolveNextInterval } = __testables
    const baseInterval = 500
    const nextInterval = resolveNextInterval(baseInterval, null)
    expect(nextInterval).toBeGreaterThanOrEqual(1000)

    const rateLimitError = new OpenSkyRateLimitError(30_000)
    const rateLimitInterval = resolveNextInterval(5_000, rateLimitError)
    expect(rateLimitInterval).toBeGreaterThanOrEqual(rateLimitError.retryAfterMs)
  })
})
