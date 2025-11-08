export type NoiseLevel = '高' | '中' | '低' | null

export interface ObservationSite {
  name: string
  latitude: number
  longitude: number
  altitude?: number
  radius: number
  maxAltitude: number
}

export interface PlaneState {
  id: string
  callsign?: string | null
  x: number
  y: number
  v: number | null
  trackRad: number | null
  h?: number | null
}

export interface PassEvent {
  plane: PlaneState
  eta: number
  duration: number
  dmin: number
  level: NoiseLevel
  ok: boolean
  entersAt: number
  exitsAt: number
}
