import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialButtons } from './SocialButtons'
import { SOCIAL_LINKS } from '@/lib/social'

describe('SocialButtons', () => {
  it('renders Instagram as the primary CTA', () => {
    render(<SocialButtons />)
    const instagram = screen.getByTestId('social-button-instagram')
    expect(instagram).toHaveAttribute('href', SOCIAL_LINKS.instagram)
    expect(instagram.className).toContain('social-button-primary')
  })

  it('renders YouTube as a secondary CTA', () => {
    render(<SocialButtons />)
    const youtube = screen.getByTestId('social-button-youtube')
    expect(youtube).toHaveAttribute('href', SOCIAL_LINKS.youtube)
    expect(youtube.className).toContain('social-button-secondary')
  })
})
