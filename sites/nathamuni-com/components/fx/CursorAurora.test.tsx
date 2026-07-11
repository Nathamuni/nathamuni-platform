import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CursorAurora } from './CursorAurora'

function stubMatchMedia(finePointer: boolean) {
  window.matchMedia = ((query: string) => ({
    // Only the fine-pointer/hover query reports true; reduced-motion always
    // reports false so the effect isn't short-circuited by the other gate.
    matches: query.includes('pointer: fine') ? finePointer : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('CursorAurora', () => {
  afterEach(() => {
    stubMatchMedia(false)
  })

  it('renders without crashing as an aria-hidden overlay', () => {
    render(<CursorAurora />)
    const el = screen.getByTestId('cursor-aurora')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not activate (stays invisible) when matchMedia reports no fine pointer', () => {
    // vitest.setup.ts stubs matchMedia to always report matches: false,
    // which is the same signal touch devices and reduced-motion users send.
    render(<CursorAurora />)
    const el = screen.getByTestId('cursor-aurora')
    expect(el.style.opacity).not.toBe('1')
    expect(el.style.opacity).toBe('')
  })

  it('activates at a capped, safe opacity (never full strength) on fine-pointer desktops', () => {
    stubMatchMedia(true)
    render(<CursorAurora />)
    const el = screen.getByTestId('cursor-aurora')
    const opacity = Number(el.style.opacity)
    expect(opacity).toBeGreaterThan(0)
    expect(opacity).toBeLessThanOrEqual(0.35)
  })
})
