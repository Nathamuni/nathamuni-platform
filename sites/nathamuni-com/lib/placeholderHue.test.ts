import { describe, expect, it } from 'vitest'
import { hueForCategory } from './placeholderHue'

describe('hueForCategory', () => {
  it('is deterministic for the same category', () => {
    expect(hueForCategory('Fitness')).toBe(hueForCategory('Fitness'))
  })

  it('returns a value between 0 and 359', () => {
    const hue = hueForCategory('Personal Growth')
    expect(hue).toBeGreaterThanOrEqual(0)
    expect(hue).toBeLessThan(360)
  })
})
