import type {
  NoiseLevel,
  NoiseThresholds,
  ObservationSite,
  PassEvent,
  PlaneState,
  StateVector
} from './types'

const EPS = 1e-6
export const EARTH_RADIUS_METERS = 6378137
const DEFAULT_NOISE_THRESHOLDS: NoiseThresholds = {
  high: 1200,
  medium: 2500
}

function createFailedEvent(plane: PlaneState, dmin: number = Infinity): PassEvent {
  return {
    plane,
    eta: Infinity,
    duration: 0,
    dmin,
    level: null,
    ok: false,
    entersAt: Infinity,
    exitsAt: Infinity
  }
}

function calculateNoiseLevel(dg: number | null, thresholds: NoiseThresholds): NoiseLevel {
  if (dg == null) return null
  if (dg < thresholds.high) return '高'
  if (dg < thresholds.medium) return '中'
  return '低'
}

export function computePassEvent(site: ObservationSite, plane: PlaneState): PassEvent {
  const { radius, maxAltitude } = site
  const thresholds = resolveNoiseThresholds(site)
  if (plane.v == null || plane.trackRad == null) {
    return createFailedEvent(plane)
  }

  const ux = Math.sin(plane.trackRad)
  const uy = Math.cos(plane.trackRad)
  const rx = plane.x
  const ry = plane.y
  const v = Math.max(plane.v, EPS)

  const tCPA = -((rx * ux + ry * uy) / v)
  const closestX = rx + v * tCPA * ux
  const closestY = ry + v * tCPA * uy
  const dmin = Math.hypot(closestX, closestY)

  const altitude = plane.h ?? null
  if (dmin > radius || (altitude != null && altitude > maxAltitude)) {
    return createFailedEvent(plane, dmin)
  }

  const underRadical = radius * radius - dmin * dmin
  const timeToBorder = Math.sqrt(underRadical) / v
  const t1 = tCPA - timeToBorder
  const t2 = tCPA + timeToBorder

  if (t2 < 0) {
    return createFailedEvent(plane, dmin)
  }

  const eta = Math.max(t1, 0)
  const entersAt = eta
  const exitsAt = Math.max(0, t2)
  const duration = Math.max(0, exitsAt - eta)

  const siteAltitude = site.altitude ?? 0
  const dg = altitude == null ? null : Math.hypot(dmin, altitude - siteAltitude)
  const level = calculateNoiseLevel(dg, thresholds)

  return {
    plane,
    eta,
    duration,
    dmin,
    level,
    ok: true,
    entersAt,
    exitsAt
  }
}

export function normalizeStateVector(
  site: ObservationSite,
  state: StateVector
): PlaneState | null {
  const { latitude, longitude } = state
  if (latitude == null || longitude == null) return null
  const altitude = state.geoAltitude ?? state.baroAltitude ?? null
  return {
    id: state.icao24,
    callsign: state.callsign?.trim() || null,
    ...geodeticToEnu(site, { latitude, longitude }),
    v: state.velocity,
    trackRad: state.trueTrack == null ? null : toRadians(state.trueTrack),
    h: altitude
  }
}

type GeodeticPoint = { latitude: number; longitude: number }

export function geodeticToEnu(site: ObservationSite, point: GeodeticPoint) {
  // NOTE: This uses an equirectangular projection that is sufficiently precise
  // within the ~700 m operating radius of the MVP. For larger regions or
  // high-precision needs, replace with a more exact geodetic conversion.
  const lat0 = toRadians(site.latitude)
  const lon0 = toRadians(site.longitude)
  const lat = toRadians(point.latitude)
  const lon = toRadians(point.longitude)
  const dLat = lat - lat0
  const dLon = lon - lon0
  const meanLat = (lat + lat0) / 2
  const x = dLon * Math.cos(meanLat) * EARTH_RADIUS_METERS
  const y = dLat * EARTH_RADIUS_METERS
  return { x, y }
}

function resolveNoiseThresholds(site: ObservationSite): NoiseThresholds {
  const overrides = site.noiseThresholds
  if (!overrides) return DEFAULT_NOISE_THRESHOLDS
  return {
    high: overrides.high ?? DEFAULT_NOISE_THRESHOLDS.high,
    medium: overrides.medium ?? DEFAULT_NOISE_THRESHOLDS.medium
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
