import { startTransition, useEffect, useState } from 'react'
import { buildStatesUrl, parseOpenSkyStates, OpenSkyRateLimitError } from '../lib/opensky'
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

/**
 * 定期輪詢 OpenSky Network API 以取得航機狀態，並將其整理成通過事件清單。
 *
 * @param options 輪詢設定。
 * @param options.site 觀測站點。請確保此物件於元件外部定義或以 `useMemo` 穩定化，避免在重新渲染時意外重啟輪詢。
 * @param options.intervalMs 輪詢間隔（毫秒）。
 * @returns 目前的通過事件與最後一次輪詢的錯誤（若有）。
 */
const MIN_INTERVAL_MS = 1000

function resolveNextInterval(baseIntervalMs: number, error: Error | null): number {
  const rateLimitDelay = error instanceof OpenSkyRateLimitError ? error.retryAfterMs : 0
  return Math.max(baseIntervalMs, rateLimitDelay, MIN_INTERVAL_MS)
}

export function useOpenSkyPolling({ site, intervalMs }: UseOpenSkyPollingOptions): UseOpenSkyPollingResult {
  const [passEvents, setPassEvents] = useState<PassEvent[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const requestUrl = buildStatesUrl(site)
    let timerId: number | null = null
    let nextInterval = resolveNextInterval(intervalMs, null)

    const pollOpenSky = async () => {
      try {
        const response = await fetch(requestUrl, {
          cache: 'no-store',
          signal: controller.signal
        })
        if (!response.ok) {
          if (response.status === 429) {
            throw OpenSkyRateLimitError.fromResponse(response)
          }
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
        nextInterval = resolveNextInterval(intervalMs, null)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to load OpenSky states', error)
          const normalizedError = error instanceof Error ? error : new Error(String(error))
          nextInterval = resolveNextInterval(intervalMs, normalizedError)
          startTransition(() => {
            setPassEvents([])
            setError(normalizedError)
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          timerId = window.setTimeout(pollOpenSky, nextInterval)
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

export const __testables = { resolveNextInterval }
