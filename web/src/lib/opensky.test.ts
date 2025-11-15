import { describe, expect, it } from 'vitest'
import { buildStatesUrl, parseOpenSkyStates, OpenSkyRateLimitError, __testables } from './opensky'
import type { ObservationSite } from './types'

describe('buildStatesUrl', () => {
  it('generates a bounding box URL around the observation site', () => {
    const site: ObservationSite = {
      name: 'Test Site',
      latitude: 25.0721,
      longitude: 121.5222,
      radius: 25_000,
      maxAltitude: 6000
    }

    const url = new URL(buildStatesUrl(site))

    expect(url.origin + url.pathname).toBe('https://opensky-network.org/api/states/all')

    const lamin = Number(url.searchParams.get('lamin'))
    const lamax = Number(url.searchParams.get('lamax'))
    const lomin = Number(url.searchParams.get('lomin'))
    const lomax = Number(url.searchParams.get('lomax'))

    expect(Number.isFinite(lamin)).toBe(true)
    expect(Number.isFinite(lamax)).toBe(true)
    expect(Number.isFinite(lomin)).toBe(true)
    expect(Number.isFinite(lomax)).toBe(true)

    expect((lamax + lamin) / 2).toBeCloseTo(site.latitude, 5)
    expect((lomax + lomin) / 2).toBeCloseTo(site.longitude, 5)

    const expectedLatDelta = site.radius / __testables.METERS_PER_DEGREE_LAT
    expect((lamax - lamin) / 2).toBeCloseTo(expectedLatDelta, 5)
  })
})

describe('parseOpenSkyStates', () => {
  it('normalizes OpenSky rows into state vectors', () => {
    const payload = {
      time: 123,
      states: [
        [
          'abc123',
          ' EVA123 ',
          'Taiwan',
          0,
          0,
          121.55,
          25.08,
          500,
          false,
          120,
          90,
          0,
          null,
          520
        ],
        [null, 'MISSING', 'Taiwan', 0, 0, 121.5, 25.0, null, false, null, null, 0, null, null],
        [
          'def456',
          null,
          'Japan',
          0,
          0,
          null,
          null,
          null,
          false,
          null,
          null,
          0,
          null,
          null
        ]
      ]
    }

    const result = parseOpenSkyStates(payload)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      icao24: 'abc123',
      callsign: 'EVA123',
      longitude: 121.55,
      latitude: 25.08,
      baroAltitude: 500,
      geoAltitude: 520,
      velocity: 120,
      trueTrack: 90
    })

    expect(result[1]).toMatchObject({
      icao24: 'def456',
      callsign: null,
      longitude: null,
      latitude: null
    })
  })

  it('returns an empty list for invalid payloads', () => {
    expect(parseOpenSkyStates(null)).toEqual([])
    expect(parseOpenSkyStates({ states: null })).toEqual([])
    expect(parseOpenSkyStates({ states: ['invalid'] })).toEqual([])
  })
})

describe('OpenSkyRateLimitError', () => {
  it('enforces a minimum retry delay and formats a helpful message', () => {
    const error = new OpenSkyRateLimitError(15_000)
    expect(error.retryAfterMs).toBeGreaterThanOrEqual(60_000)
    expect(error.message).toContain('60 秒後')
    expect(error.name).toBe('OpenSkyRateLimitError')
  })
})
