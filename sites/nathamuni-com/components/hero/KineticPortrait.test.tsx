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

  it('renders the lightweight static portrait on touch devices instead of video', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(false)
    render(<KineticPortrait />)
    expect(screen.getByTestId('portrait-static')).toBeInTheDocument()
    expect(screen.queryByTestId('portrait-forward')).not.toBeInTheDocument()
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

  it('falls back to the static image if a video errors at runtime', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    fireEvent.error(screen.getByTestId('portrait-forward'))
    expect(screen.getByTestId('portrait-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('kinetic-portrait')).not.toBeInTheDocument()
  })

  it('seeks to the first frame once metadata loads, so the portrait paints without playing', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    const forward = screen.getByTestId('portrait-forward') as HTMLVideoElement
    fireEvent.loadedMetadata(forward)
    expect(forward.currentTime).toBeCloseTo(0.01)
  })
})
