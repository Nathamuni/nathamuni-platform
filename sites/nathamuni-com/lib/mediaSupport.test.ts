import { afterEach, describe, expect, it, vi } from 'vitest'
import { supportsAlphaWebm, prefersHoverInteraction } from './mediaSupport'

describe('supportsAlphaWebm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when canPlayType reports "probably"', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      canPlayType: () => 'probably',
    } as unknown as HTMLVideoElement)
    expect(supportsAlphaWebm()).toBe(true)
  })

  it('returns false when canPlayType reports empty string', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      canPlayType: () => '',
    } as unknown as HTMLVideoElement)
    expect(supportsAlphaWebm()).toBe(false)
  })
})

describe('prefersHoverInteraction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when the hover media query matches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)
    expect(prefersHoverInteraction()).toBe(true)
  })

  it('returns false when the hover media query does not match', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList)
    expect(prefersHoverInteraction()).toBe(false)
  })
})
