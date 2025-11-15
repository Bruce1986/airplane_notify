import type { ObservationSite, StateVector } from './types'

const METERS_PER_DEGREE_LAT = 111_320
const MIN_LON_SCALE = 1e-6

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

  const url = new URL('https://opensky-network.org/api/states/all')
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

  const [
    icao24,
    callsign,
    ,
    ,
    ,
    longitude,
    latitude,
    baroAltitude,
    ,
    velocity,
    trueTrack,
    ,
    ,
    geoAltitude
  ] = row as (string | number | null)[]

  if (typeof icao24 !== 'string') return null

  return {
    icao24,
    callsign: typeof callsign === 'string' ? callsign.trim() || null : null,
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
    geo_altitude: typeof geoAltitude === 'number' ? geoAltitude : null,
    baro_altitude: typeof baroAltitude === 'number' ? baroAltitude : null,
    velocity: typeof velocity === 'number' ? velocity : null,
    true_track: typeof trueTrack === 'number' ? trueTrack : null
  }
}

export const __testables = {
  normalizeStateRow,
  METERS_PER_DEGREE_LAT
}
