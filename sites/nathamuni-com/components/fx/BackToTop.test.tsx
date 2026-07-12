import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { BackToTop } from './BackToTop'

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
}

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

describe('BackToTop', () => {
  beforeEach(() => {
    setScroll(0)
    stubMatchMedia(false)
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    setScroll(0)
    stubMatchMedia(false)
  })

  it('is hidden (aria-hidden, not focusable) before scrolling', () => {
    render(<BackToTop />)
    const btn = screen.getByTestId('back-to-top')
    expect(btn).toHaveAttribute('aria-hidden', 'true')
    expect(btn).toHaveAttribute('tabindex', '-1')
    expect(btn.className).not.toContain('btt-visible')
  })

  it('becomes visible after scrolling past two viewport heights', () => {
    render(<BackToTop />)
    const btn = screen.getByTestId('back-to-top')
    setScroll(window.innerHeight * 2 + 1)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(btn).toHaveAttribute('aria-hidden', 'false')
    expect(btn.className).toContain('btt-visible')
  })

  it('has an accessible label', () => {
    render(<BackToTop />)
    expect(screen.getByLabelText('Back to top')).toBeInTheDocument()
  })

  it('smooth-scrolls to top on click', () => {
    render(<BackToTop />)
    fireEvent.click(screen.getByTestId('back-to-top'))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('jumps instantly (no smooth behavior) under prefers-reduced-motion', () => {
    stubMatchMedia(true)
    render(<BackToTop />)
    fireEvent.click(screen.getByTestId('back-to-top'))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })
})
