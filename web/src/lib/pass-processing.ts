import { computePassEvent, normalizeStateVector } from './geometry'
import type { ObservationSite, PassEvent, StateVector } from './types'

export function processStateVector(
  site: ObservationSite,
  state: StateVector
): PassEvent | null {
  const plane = normalizeStateVector(site, state)
  if (!plane) return null
  const event = computePassEvent(site, plane)
  return event.ok ? event : null
}

export function processPassEvents(
  site: ObservationSite,
  stateVectors: StateVector[]
): PassEvent[] {
  return stateVectors
    .map((state) => processStateVector(site, state))
    .filter((event): event is PassEvent => event !== null)
    .sort((a, b) => a.eta - b.eta)
}
