import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
  it('renders its children and no overlay initially', () => {
    renderPeek()
    expect(screen.getByAltText('thumb')).toBeInTheDocument()
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('opens the enlarged preview on mouse hover and closes on leave', () => {
    renderPeek()
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'mouse' })
    expect(screen.getByTestId('thumb-peek-overlay')).toBeInTheDocument()
    fireEvent.pointerLeave(region, { pointerType: 'mouse' })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('does not open on touch pointer enter (scrolling must not trigger it)', () => {
    renderPeek(true)
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'touch' })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    renderPeek()
    const region = screen.getByTestId('thumb-peek')
    fireEvent.pointerEnter(region, { pointerType: 'mouse' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('thumb-peek-overlay')).not.toBeInTheDocument()
  })

  it('shows the full uncropped image in the overlay', () => {
    renderPeek()
    fireEvent.pointerEnter(screen.getByTestId('thumb-peek'), { pointerType: 'mouse' })
    const overlay = screen.getByTestId('thumb-peek-overlay')
    const img = overlay.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('/images/thumbnails/example.jpg')
  })
})
