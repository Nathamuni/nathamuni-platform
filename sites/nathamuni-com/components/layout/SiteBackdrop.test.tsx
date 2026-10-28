import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteBackdrop } from './SiteBackdrop'

describe('SiteBackdrop', () => {
  it('is decorative: hidden from assistive tech', () => {
    render(<SiteBackdrop />)
    expect(screen.getByTestId('site-backdrop')).toHaveAttribute('aria-hidden', 'true')
  })

  it('carries the themed art, two orbs and a pattern layer', () => {
    const { container } = render(<SiteBackdrop />)
    expect(container.querySelectorAll('.site-backdrop-img').length).toBeGreaterThan(1)
    expect(container.querySelectorAll('.site-orb')).toHaveLength(2)
    expect(container.querySelector('.site-backdrop-pattern')).not.toBeNull()
  })
})
