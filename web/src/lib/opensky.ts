import type { ObservationSite, StateVector } from './types'

const METERS_PER_DEGREE_LAT = 111_320
const MIN_LON_SCALE = 1e-6
const OPENSKY_STATES_API_URL = 'https://opensky-network.org/api/states/all'

// For field indices, see OpenSky REST API documentation:
// https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors
const StateVectorIdx = {
  ICAO24: 0,
  CALLSIGN: 1,
  LONGITUDE: 5,
  LATITUDE: 6,
  BARO_ALTITUDE: 7,
  VELOCITY: 9,
  TRUE_TRACK: 10,
  GEO_ALTITUDE: 13
} as const

export interface OpenSkyStatesResponse {
  time: number
  states: unknown[] | null
}

export function buildStatesUrl(site: ObservationSite): string {
  const centerLat = site.latitude
  const centerLon = site.longitude
  const radius = Math.max(0, site.radius)

  const deltaLat = radius / METERS_PER_DEGREE_LAT
  const metersPerDegreeLon = Math.max(
    Math.cos((centerLat * Math.PI) / 180) * METERS_PER_DEGREE_LAT,
    MIN_LON_SCALE
  )
  const deltaLon = radius / metersPerDegreeLon

  const url = new URL(OPENSKY_STATES_API_URL)
  url.searchParams.set('lamin', String(centerLat - deltaLat))
  url.searchParams.set('lamax', String(centerLat + deltaLat))
  url.searchParams.set('lomin', String(centerLon - deltaLon))
  url.searchParams.set('lomax', String(centerLon + deltaLon))
  return url.toString()
}

export function parseOpenSkyStates(payload: unknown): StateVector[] {
  if (!payload || typeof payload !== 'object') return []
  const response = payload as Partial<OpenSkyStatesResponse>
  if (!Array.isArray(response.states)) return []

  return response.states
    .map((state) => normalizeStateRow(state))
    .filter((vector): vector is StateVector => vector != null)
}

function normalizeStateRow(row: unknown): StateVector | null {
  if (!Array.isArray(row)) return null

  const typedRow = row as (string | number | null)[]
  const icao24 = typedRow[StateVectorIdx.ICAO24]
  if (typeof icao24 !== 'string') return null

  const callsign = typedRow[StateVectorIdx.CALLSIGN]
  const getNumericField = (index: number): number | null => {
    const value = typedRow[index]
    return typeof value === 'number' ? value : null
  }

  return {
    icao24,
    callsign: typeof callsign === 'string' ? callsign.trim() || null : null,
    latitude: getNumericField(StateVectorIdx.LATITUDE),
    longitude: getNumericField(StateVectorIdx.LONGITUDE),
    geoAltitude: getNumericField(StateVectorIdx.GEO_ALTITUDE),
    baroAltitude: getNumericField(StateVectorIdx.BARO_ALTITUDE),
    velocity: getNumericField(StateVectorIdx.VELOCITY),
    trueTrack: getNumericField(StateVectorIdx.TRUE_TRACK)
  }
}

export const __testables = {
  normalizeStateRow,
  METERS_PER_DEGREE_LAT
}
