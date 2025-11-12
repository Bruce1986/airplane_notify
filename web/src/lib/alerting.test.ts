import { describe, expect, it } from 'vitest'
import { evaluateAlertStatus, __testables } from './alerting'
import type { PassEvent } from './types'

function createEvent(overrides: Partial<PassEvent> = {}): PassEvent {
  return {
    plane: {
      id: 'abc123',
      callsign: 'EVA123',
      x: 0,
      y: 0,
      v: 90,
      trackRad: 0,
      h: 600
    },
    eta: 45,
    duration: 30,
    dmin: 150,
    level: '中',
    ok: true,
    entersAt: 10,
    exitsAt: 40,
    ...overrides
  }
}

describe('evaluateAlertStatus', () => {
  it('returns idle stage when no event is provided', () => {
    const status = evaluateAlertStatus(null)
    expect(status.stage).toBe('idle')
    expect(status.title).toContain('目前沒有預警中的航機')
  })

  it('categorizes events by ETA thresholds', () => {
    expect(evaluateAlertStatus(createEvent({ eta: 60 })).stage).toBe('monitor')
    expect(evaluateAlertStatus(createEvent({ eta: 25 })).stage).toBe('warning')
    expect(evaluateAlertStatus(createEvent({ eta: 8 })).stage).toBe('critical')
    expect(evaluateAlertStatus(createEvent({ eta: 0 })).stage).toBe('active')
  })

  it('normalizes reversed thresholds', () => {
    const status = evaluateAlertStatus(createEvent({ eta: 12 }), {
      warning: 5,
      critical: 20
    })
    expect(status.stage).toBe('critical')
  })
})

describe('alerting helpers', () => {
  const { determineStage, normalizeThresholds, formatSeconds } = __testables

  it('ensures thresholds stay non-negative and ordered', () => {
    expect(normalizeThresholds({ warning: -5, critical: 8 })).toEqual({
      warning: 8,
      critical: 8
    })
  })

  it('formats seconds with rounding and floor at zero', () => {
    expect(formatSeconds(12.6)).toBe('13 秒')
    expect(formatSeconds(-5)).toBe('0 秒')
  })

  it('determines stages using normalized thresholds', () => {
    const thresholds = { warning: 30, critical: 10 }
    expect(determineStage(null, thresholds)).toBe('idle')
    expect(determineStage(createEvent({ eta: 35 }), thresholds)).toBe('monitor')
    expect(determineStage(createEvent({ eta: 25 }), thresholds)).toBe('warning')
    expect(determineStage(createEvent({ eta: 5 }), thresholds)).toBe('critical')
    expect(determineStage(createEvent({ eta: 0 }), thresholds)).toBe('active')
  })
})
