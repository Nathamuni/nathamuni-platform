import { describe, expect, it } from 'vitest'
import { SOCIAL_LINKS } from './social'

describe('SOCIAL_LINKS', () => {
  it('has the exact Instagram profile URL', () => {
    expect(SOCIAL_LINKS.instagram).toBe('https://www.instagram.com/nathamuni_/')
  })

  it('has the exact YouTube channel URL', () => {
    expect(SOCIAL_LINKS.youtube).toBe('https://www.youtube.com/@LogicAndLaunch')
  })
})
