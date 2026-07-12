import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ScrollProgress } from './ScrollProgress'

function setScroll(y: number, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: clientHeight,
    configurable: true,
  })
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
}

describe('ScrollProgress', () => {
  afterEach(() => {
    setScroll(0, 0, 0)
  })

  it('renders an aria-hidden, pointer-events-none hairline', () => {
    render(<ScrollProgress />)
    const track = screen.getByTestId('scroll-progress')
    expect(track).toHaveAttribute('aria-hidden', 'true')
  })

  it('starts with the fill scaled to 0 when at the top of an unscrolled page', () => {
    setScroll(0, 0, 0)
    render(<ScrollProgress />)
    const fill = screen.getByTestId('scroll-progress-fill')
    expect(fill.style.transform).toBe('scaleX(0)')
  })

  it('scales the fill to the scrolled fraction of the document on scroll', () => {
    setScroll(500, 1500, 500)
    render(<ScrollProgress />)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    const fill = screen.getByTestId('scroll-progress-fill')
    // scrollable = 1500 - 500 = 1000; fraction = 500 / 1000 = 0.5
    expect(fill.style.transform).toBe('scaleX(0.5)')
  })

  it('clamps the fraction to 1 even if scrollY overshoots', () => {
    setScroll(5000, 1500, 500)
    render(<ScrollProgress />)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    const fill = screen.getByTestId('scroll-progress-fill')
    expect(fill.style.transform).toBe('scaleX(1)')
  })
})
