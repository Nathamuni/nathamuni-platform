import { describe, expect, it } from 'vitest'
import { arcPosition, skyPhase, weatherKind } from './sky'

describe('skyPhase', () => {
  it('maps hours to phases', () => {
    expect(skyPhase(5.5)).toBe('dawn')
    expect(skyPhase(12)).toBe('day')
    expect(skyPhase(17.5)).toBe('dusk')
    expect(skyPhase(23)).toBe('night')
    expect(skyPhase(2)).toBe('night')
  })

  it('is safe on junk input', () => {
    expect(skyPhase(NaN)).toBe('day')
    expect(skyPhase(-3)).toBe('night') // wraps to 21h
  })
})

describe('arcPosition', () => {
  it('puts the sun at the top at noon', () => {
    const noon = arcPosition(12)
    expect(noon.body).toBe('sun')
    expect(noon.x).toBeCloseTo(0.5)
    expect(noon.y).toBeCloseTo(1)
  })

  it('puts the sun on the horizon at sunrise and sunset', () => {
    expect(arcPosition(6).y).toBeCloseTo(0)
    expect(arcPosition(6).x).toBeCloseTo(0)
    expect(arcPosition(17.99).y).toBeLessThan(0.01)
  })

  it('switches to the moon at night, midnight at the top', () => {
    const midnight = arcPosition(0)
    expect(midnight.body).toBe('moon')
    expect(midnight.x).toBeCloseTo(0.5)
    expect(midnight.y).toBeCloseTo(1)
  })
})

describe('weatherKind', () => {
  it('collapses WMO codes to themes', () => {
    expect(weatherKind(0)).toBe('clear')
    expect(weatherKind(2)).toBe('cloudy')
    expect(weatherKind(45)).toBe('cloudy')
    expect(weatherKind(61)).toBe('rain')
    expect(weatherKind(95)).toBe('rain')
    expect(weatherKind(NaN)).toBe('clear')
  })
})
