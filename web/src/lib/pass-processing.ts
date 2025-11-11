import { computePassEvent, normalizeStateVector } from './geometry'
import type { ObservationSite, PassEvent, StateVector } from './types'

export function processPassEvents(
  site: ObservationSite,
  stateVectors: StateVector[]
): PassEvent[] {
  return stateVectors
    .flatMap((state) => {
      const plane = normalizeStateVector(site, state)
      if (!plane) return []
      const event = computePassEvent(site, plane)
      return event.ok ? [event] : []
    })
    .sort((a, b) => a.eta - b.eta)
}
