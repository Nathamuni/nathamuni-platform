import { describe, expect, it } from 'vitest'
import { computeBmi, proteinRange } from './health'

describe('computeBmi', () => {
  it('computes the classic 70kg / 175cm case', () => {
    expect(computeBmi(70, 175)).toEqual({ value: 22.9, category: 'Healthy range' })
  })

  it('classifies each WHO band by its boundary', () => {
    expect(computeBmi(50, 175)?.category).toBe('Underweight') // 16.3
    expect(computeBmi(57, 175)?.category).toBe('Healthy range') // 18.6
    expect(computeBmi(80, 175)?.category).toBe('Overweight') // 26.1
    expect(computeBmi(95, 175)?.category).toBe('Obese') // 31.0
  })

  it('rejects implausible or non-finite inputs', () => {
    expect(computeBmi(0, 175)).toBeNull()
    expect(computeBmi(70, 0)).toBeNull()
    expect(computeBmi(-70, 175)).toBeNull()
    expect(computeBmi(NaN, 175)).toBeNull()
    expect(computeBmi(70, Infinity)).toBeNull()
    expect(computeBmi(500, 175)).toBeNull()
    expect(computeBmi(70, 60)).toBeNull()
  })
})

describe('proteinRange', () => {
  it('uses 1.6–2.2 g/kg when training', () => {
    expect(proteinRange(70, true)).toEqual({ minG: 112, maxG: 154, perKgLabel: '1.6–2.2 g/kg' })
  })

  it('uses 0.8–1.2 g/kg when not training', () => {
    expect(proteinRange(70, false)).toEqual({ minG: 56, maxG: 84, perKgLabel: '0.8–1.2 g/kg' })
  })

  it('rejects implausible weight', () => {
    expect(proteinRange(0, true)).toBeNull()
    expect(proteinRange(NaN, false)).toBeNull()
  })
})
