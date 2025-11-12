import { describe, expect, it } from 'vitest'
import { formatSeconds } from './formatters'

describe('formatSeconds', () => {
  it('returns em dash for non-finite values', () => {
    expect(formatSeconds(Number.NaN)).toBe('—')
    expect(formatSeconds(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('rounds to the nearest whole second and clamps at zero', () => {
    expect(formatSeconds(12.6)).toBe('13 秒')
    expect(formatSeconds(-5)).toBe('0 秒')
  })
})
