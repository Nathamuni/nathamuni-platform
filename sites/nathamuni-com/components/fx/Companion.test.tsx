import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Companion } from './Companion'

function stubMatchMedia(reducedMotion: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('Companion', () => {
  beforeEach(() => {
    window.localStorage.clear()
    stubMatchMedia(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    stubMatchMedia(false)
  })

  it('renders the picker button', () => {
    render(<Companion />)
    expect(screen.getByRole('button', { name: 'Choose companion' })).toBeInTheDocument()
  })

  it('shows the default character (Kitty) after mount', () => {
    render(<Companion />)
    const character = screen.getByTestId('companion-character')
    expect(character).toBeInTheDocument()
    expect(character).toHaveAttribute('data-character', 'kitty')
  })

  it('selecting Off hides the character and persists the choice to localStorage', () => {
    render(<Companion />)
    fireEvent.click(screen.getByRole('button', { name: 'Choose companion' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /off/i }))

    expect(screen.queryByTestId('companion-character')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('companion-choice')).toBe('off')
  })

  it('renders a static character when prefers-reduced-motion is set', () => {
    stubMatchMedia(true)
    render(<Companion />)
    const character = screen.getByTestId('companion-character')
    expect(character).toBeInTheDocument()
    expect(character).toHaveAttribute('data-reduced', 'true')
  })

  it('does not throw when the document is clicked', () => {
    render(<Companion />)
    expect(() => {
      fireEvent.click(document.body)
    }).not.toThrow()
  })

  it('renders a vibrant multi-stop violet-magenta-cyan gradient for Kitty', () => {
    // Kitty is the default character, so the only <stop> elements present
    // belong to its <linearGradient>.
    const { container } = render(<Companion />)
    const stops = Array.from(container.querySelectorAll('stop'))
    expect(stops.length).toBeGreaterThanOrEqual(3)
    const colors = stops.map((s) => s.getAttribute('stop-color'))
    expect(colors).toEqual(expect.arrayContaining(['#8b5cf6', '#ec4899', '#22d3ee']))
  })

  it('places the character in the bottom lane on mount, never mid-page', () => {
    render(<Companion />)
    const character = screen.getByTestId('companion-character')
    const match = character.style.transform.match(/translate3d\(([-.\d]+)px,\s*([-.\d]+)px/)
    expect(match).not.toBeNull()
    const y = Number(match?.[2])
    // jsdom's default viewport is 1024x768; desktop lane band is 90px above
    // the true bottom, so the character's top edge must land within it.
    expect(y).toBeGreaterThan(window.innerHeight - 90 - 56)
    expect(y).toBeLessThanOrEqual(window.innerHeight - 56)
  })
})
