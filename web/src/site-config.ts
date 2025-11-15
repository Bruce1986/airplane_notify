import type { ObservationSite } from './lib/types'

export const observationSite: ObservationSite = {
  name: '圓山里演出現場',
  latitude: 25.0721,
  longitude: 121.5222,
  altitude: 20,
  radius: 25_000,
  maxAltitude: 6000,
  noiseThresholds: {
    high: 1200,
    medium: 2500
  }
}

export const POLL_INTERVAL_MS = 10_000

export const ALERT_THRESHOLDS = {
  warning: 300,
  critical: 120
}
