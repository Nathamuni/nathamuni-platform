import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ThumbPeek } from './ThumbPeek'

function renderPeek(longPress = false) {
  return render(
    <ThumbPeek src="/images/thumbnails/example.jpg" hue={262} longPress={longPress}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/thumbnails/example.jpg" alt="thumb" />
    </ThumbPeek>
  )
}

describe('ThumbPeek', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function hoverOpen(region: HTMLElement) {
    fireEvent.pointerEnter(region, { pointerType: 'mouse' })
    act(() => {
      vi.advanceTimersByTime(600)
    })
  }

  it('renders its children and no overlay initially', () => {
    renderPeek()
    expect(screen.getByAltText('thumb')).toBeInTheDocument()
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('opens the enlarged preview after the 0.6s hover delay and closes on leave', () => {
    renderPeek()
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'mouse' })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByTestId('thumb-peek-overlay')).toBeInTheDocument()
    fireEvent.pointerLeave(region, { pointerType: 'mouse' })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('does not open if the pointer leaves before the delay elapses', () => {
    renderPeek()
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'mouse' })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    fireEvent.pointerLeave(region, { pointerType: 'mouse' })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('does not open on touch pointer enter (scrolling must not trigger it)', () => {
    renderPeek(true)
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'touch' })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderPeek()
    hoverOpen(screen.getByTestId('thumb-peek'))
    expect(screen.getByTestId('thumb-peek-overlay')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('shows the full uncropped image in the overlay', () => {
    renderPeek()
    hoverOpen(screen.getByTestId('thumb-peek'))
    const overlay = screen.getByTestId('thumb-peek-overlay')
    const img = overlay.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('/images/thumbnails/example.jpg')
  })
})
