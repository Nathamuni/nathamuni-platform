import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { SOCIAL_LINKS } from '@/lib/social'

describe('Footer', () => {
  it('links to Instagram and YouTube', () => {
    render(<Footer />)
    expect(screen.getByTestId('footer-instagram')).toHaveAttribute('href', SOCIAL_LINKS.instagram)
    expect(screen.getByTestId('footer-youtube')).toHaveAttribute('href', SOCIAL_LINKS.youtube)
  })
})
