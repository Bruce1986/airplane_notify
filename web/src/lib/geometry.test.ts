import { describe, expect, it } from 'vitest'
import { computePassEvent } from './geometry'
import type { ObservationSite, PlaneState } from './types'

const site: ObservationSite = {
  name: 'Test Site',
  latitude: 0,
  longitude: 0,
  radius: 25_000,
  maxAltitude: 6000,
  noiseThresholds: {
    high: 1200,
    medium: 2500
  }
}

function makePlane(overrides: Partial<PlaneState> = {}): PlaneState {
  return {
    id: 'abc',
    callsign: null,
    x: -52_000,
    y: 0,
    v: 90,
    trackRad: Math.PI / 2,
    h: 800,
    ...overrides
  }
}

describe('computePassEvent', () => {
  it('flags approaching planes within radius and altitude', () => {
    const event = computePassEvent(site, makePlane())
    expect(event.ok).toBe(true)
    expect(event.eta).toBeCloseTo(300, 2)
    expect(event.duration).toBeCloseTo(555.56, 2)
    expect(event.level).toBe('高')
  })

  it('respects site-specific noise thresholds', () => {
    const relaxedSite: ObservationSite = {
      ...site,
      noiseThresholds: {
        high: 500,
        medium: 1200
      }
    }

    const event = computePassEvent(relaxedSite, makePlane())

    expect(event.level).toBe('中')
  })

  it('returns Infinity eta when plane misses radius', () => {
    const event = computePassEvent(site, makePlane({ y: 30_000 }))
    expect(event.ok).toBe(false)
    expect(event.eta).toBe(Infinity)
    expect(event.duration).toBe(0)
  })

  it('returns false when altitude exceeds max', () => {
    const event = computePassEvent(site, makePlane({ h: 7000 }))
    expect(event.ok).toBe(false)
  })

  it('handles planes already inside the radius', () => {
    const event = computePassEvent(site, makePlane({ x: -20_000 }))
    expect(event.ok).toBe(true)
    expect(event.eta).toBe(0)
    expect(event.duration).toBeGreaterThan(0)
  })

  it('handles missing velocity gracefully', () => {
    const event = computePassEvent(site, makePlane({ v: null }))
    expect(event.ok).toBe(false)
    expect(event.eta).toBe(Infinity)
  })
})
