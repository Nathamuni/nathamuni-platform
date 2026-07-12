import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { PROFILE } from '@/lib/profile'
import { SOCIAL_LINKS } from '@/lib/social'

describe('Footer', () => {
  it('renders the brand block from PROFILE (mark, name, headline)', () => {
    render(<Footer />)
    const footer = screen.getByTestId('site-footer')
    expect(footer).toHaveTextContent(PROFILE.mark)
    expect(footer).toHaveTextContent(PROFILE.name)
    expect(footer).toHaveTextContent(PROFILE.headline)
  })

  it('renders the Explore, Read, and More nav columns', () => {
    render(<Footer />)
    const nav = screen.getByRole('navigation', { name: 'Footer' })
    ;['Home', 'Feed', 'Videos', 'Moments', 'Blog', 'Books', 'Journey', 'About', 'Projects', 'Stats', 'Ask'].forEach(
      (label) => {
        expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
      }
    )
    expect(nav).toHaveTextContent('Explore')
    expect(nav).toHaveTextContent('Read')
    expect(nav).toHaveTextContent('More')
  })

  it('links to Instagram and YouTube via SocialButtons', () => {
    render(<Footer />)
    expect(screen.getByTestId('social-button-instagram')).toHaveAttribute('href', SOCIAL_LINKS.instagram)
    expect(screen.getByTestId('social-button-youtube')).toHaveAttribute('href', SOCIAL_LINKS.youtube)
  })

  it('shows the privacy line and copyright', () => {
    render(<Footer />)
    const footer = screen.getByTestId('site-footer')
    expect(footer).toHaveTextContent('No servers. No trackers. Built to be searched.')
    expect(footer).toHaveTextContent(`${PROFILE.name}. All rights reserved.`)
  })
})
