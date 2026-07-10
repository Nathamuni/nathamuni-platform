import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroPortrait } from './HeroPortrait'

describe('HeroPortrait', () => {
  it('renders the static portrait image with the expected src', () => {
    render(<HeroPortrait />)
    const img = screen.getByTestId('hero-portrait-img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/portrait-static.webp')
  })

  it('renders the frame wrapper', () => {
    render(<HeroPortrait />)
    expect(screen.getByTestId('hero-portrait-frame')).toBeInTheDocument()
  })
})
