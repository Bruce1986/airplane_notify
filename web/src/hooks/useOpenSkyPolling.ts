import { startTransition, useEffect, useState } from 'react'
import { buildStatesUrl, parseOpenSkyStates } from '../lib/opensky'
import { processPassEvents } from '../lib/pass-processing'
import type { ObservationSite, PassEvent } from '../lib/types'

export interface UseOpenSkyPollingOptions {
  site: ObservationSite
  intervalMs: number
}

export interface UseOpenSkyPollingResult {
  passEvents: PassEvent[]
  error: Error | null
}

export function useOpenSkyPolling({ site, intervalMs }: UseOpenSkyPollingOptions): UseOpenSkyPollingResult {
  const [passEvents, setPassEvents] = useState<PassEvent[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const requestUrl = buildStatesUrl(site)
    let timerId: ReturnType<typeof window.setTimeout> | null = null

    const pollOpenSky = async () => {
      try {
        const response = await fetch(requestUrl, {
          cache: 'no-store',
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error(`OpenSky request failed: ${response.status}`)
        }

        const data = await response.json()
        const stateVectors = parseOpenSkyStates(data)
        const passes = processPassEvents(site, stateVectors)

        if (!controller.signal.aborted) {
          startTransition(() => {
            setPassEvents(passes)
            setError(null)
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to load OpenSky states', error)
          const normalizedError = error instanceof Error ? error : new Error(String(error))
          startTransition(() => {
            setPassEvents([])
            setError(normalizedError)
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          timerId = window.setTimeout(pollOpenSky, intervalMs)
        }
      }
    }

    pollOpenSky()

    return () => {
      controller.abort()
      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [site, intervalMs])

  return { passEvents, error }
}
