import { describe, expect, it } from 'vitest'
import { processPassEvents, processStateVector } from './pass-processing'
import { EARTH_RADIUS_METERS } from './geometry'
import type { ObservationSite, StateVector } from './types'

const site: ObservationSite = {
  name: 'Test Site',
  latitude: 0,
  longitude: 0,
  radius: 700,
  maxAltitude: 3000
}

function createStateVector(
  id: string,
  x: number,
  y: number,
  overrides: Partial<StateVector> = {}
): StateVector {
  const lat0 = 0 // radians for site latitude (0 degrees)
  const lon0 = 0
  const lat = y / EARTH_RADIUS_METERS + lat0
  const meanLat = (lat + lat0) / 2
  const lon = x / (Math.cos(meanLat) * EARTH_RADIUS_METERS) + lon0
  const toDegrees = (rad: number) => (rad * 180) / Math.PI

  const base: StateVector = {
    icao24: id,
    callsign: id.toUpperCase(),
    latitude: toDegrees(lat),
    longitude: toDegrees(lon),
    geo_altitude: 800,
    baro_altitude: 780,
    velocity: 90,
    true_track: 90
  }

  return { ...base, ...overrides }
}

describe('processPassEvents', () => {
  it('normalizes state vectors and sorts valid pass events by ETA', () => {
    const vectors: StateVector[] = [
      createStateVector('one', -800, 0, { velocity: 90, true_track: 90 }),
      createStateVector('two', -500, 0, { velocity: 60, true_track: 90 }),
      {
        icao24: 'invalid',
        callsign: null,
        latitude: null,
        longitude: null,
        geo_altitude: null,
        baro_altitude: null,
        velocity: null,
        true_track: null
      }
    ]

    const events = processPassEvents(site, vectors)

    expect(events).toHaveLength(2)
    expect(events.every((event) => event.ok)).toBe(true)
    expect(events[0].eta).toBeLessThanOrEqual(events[1].eta)
    expect(events.map((event) => event.plane.id)).toEqual(['two', 'one'])
  })
})

describe('processStateVector', () => {
  it('returns a pass event when the plane produces an ok result', () => {
    const state = createStateVector('ok', -500, 0, { velocity: 85, true_track: 90 })

    const event = processStateVector(site, state)

    expect(event).not.toBeNull()
    expect(event?.ok).toBe(true)
  })

  it('returns null when normalization fails', () => {
    const badState: StateVector = {
      icao24: 'missing',
      callsign: null,
      latitude: null,
      longitude: null,
      geo_altitude: null,
      baro_altitude: null,
      velocity: null,
      true_track: null
    }

    expect(processStateVector(site, badState)).toBeNull()
  })
})
