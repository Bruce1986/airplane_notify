import type { ObservationSite, StateVector } from './lib/types'

export const demoSite: ObservationSite = {
  name: '圓山里演出現場',
  latitude: 25.0721,
  longitude: 121.5222,
  altitude: 20,
  radius: 700,
  maxAltitude: 3000
}

export const sampleStateVectors: StateVector[] = [
  {
    icao24: 'air123',
    callsign: 'EVA123',
    latitude: 25.0785,
    longitude: 121.5225,
    geo_altitude: 600,
    baro_altitude: 580,
    velocity: 95,
    true_track: 190
  },
  {
    icao24: 'air456',
    callsign: 'CAL456',
    latitude: 25.0665,
    longitude: 121.515,
    geo_altitude: 850,
    baro_altitude: 840,
    velocity: 82,
    true_track: 70
  },
  {
    icao24: 'air789',
    callsign: 'JAL789',
    latitude: 25.085,
    longitude: 121.533,
    geo_altitude: 3400,
    baro_altitude: 3350,
    velocity: 110,
    true_track: 210
  }
]
