import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KineticPortrait } from './KineticPortrait'
import * as mediaSupport from '@/lib/mediaSupport'

describe('KineticPortrait', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback image when alpha WebM is not supported', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(false)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    expect(screen.getByTestId('portrait-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('kinetic-portrait')).not.toBeInTheDocument()
  })

  it('renders both videos when alpha WebM is supported', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    expect(screen.getByTestId('portrait-forward')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-reverse')).toBeInTheDocument()
  })

  it('plays the forward video on mouse enter when hover-capable', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play')
    render(<KineticPortrait />)
    fireEvent.mouseEnter(screen.getByTestId('kinetic-portrait'))
    expect(playSpy).toHaveBeenCalled()
  })
})
