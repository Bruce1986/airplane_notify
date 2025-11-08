import { describe, expect, it } from 'vitest'
import { computePassEvent } from './geometry'
import type { ObservationSite, PlaneState } from './types'

const site: ObservationSite = {
  name: 'Test Site',
  latitude: 0,
  longitude: 0,
  radius: 700,
  maxAltitude: 3000
}

function makePlane(overrides: Partial<PlaneState> = {}): PlaneState {
  return {
    id: 'abc',
    x: -800,
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
    expect(event.eta).toBeGreaterThan(0)
    expect(event.duration).toBeGreaterThan(0)
    expect(event.level).toBe('高')
  })

  it('returns Infinity eta when plane misses radius', () => {
    const event = computePassEvent(site, makePlane({ y: 1000 }))
    expect(event.ok).toBe(false)
    expect(event.eta).toBe(Infinity)
    expect(event.duration).toBe(0)
  })

  it('returns false when altitude exceeds max', () => {
    const event = computePassEvent(site, makePlane({ h: 5000 }))
    expect(event.ok).toBe(false)
  })

  it('handles planes already inside the radius', () => {
    const event = computePassEvent(site, makePlane({ x: -200 }))
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
