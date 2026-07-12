import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ScrollCue } from './ScrollCue'

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
}

describe('ScrollCue', () => {
  afterEach(() => {
    setScroll(0)
  })

  it('renders visible and aria-hidden at the top of the page', () => {
    setScroll(0)
    render(<ScrollCue />)
    const cue = screen.getByTestId('scroll-cue')
    expect(cue).toHaveAttribute('aria-hidden', 'true')
    expect(cue.className).not.toContain('scue-hidden')
  })

  it('fades out once scrolled past 80px', () => {
    setScroll(0)
    render(<ScrollCue />)
    setScroll(120)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByTestId('scroll-cue').className).toContain('scue-hidden')
  })

  it('stays hidden permanently even after scrolling back up', () => {
    setScroll(0)
    render(<ScrollCue />)
    setScroll(120)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    setScroll(0)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    expect(screen.getByTestId('scroll-cue').className).toContain('scue-hidden')
  })
})
