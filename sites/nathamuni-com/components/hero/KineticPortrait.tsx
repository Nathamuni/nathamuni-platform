'use client'

import { useEffect, useRef, useState } from 'react'
import { prefersHoverInteraction, supportsAlphaWebm } from '@/lib/mediaSupport'

const FORWARD_SRC = '/video/portrait-forward.webm'
const REVERSE_SRC = '/video/portrait-reverse.webm'
const FALLBACK_SRC = '/images/portrait-fallback.png'
const STATIC_SRC = '/images/portrait-static.webp'

/**
 * Desktop (hover-capable): dual alpha-WebM portrait — forward clip on hover,
 * reverse on leave, first frame painted immediately via a metadata seek.
 * Touch devices: a 24KB static portrait instead of megabytes of video —
 * mobile visitors get speed, desktop gets the signature effect.
 */
export function KineticPortrait() {
  const forwardRef = useRef<HTMLVideoElement>(null)
  const reverseRef = useRef<HTMLVideoElement>(null)
  const [canPlayAlpha, setCanPlayAlpha] = useState(true)
  const [hoverCapable, setHoverCapable] = useState(true)

  useEffect(() => {
    // One-time browser capability detection on mount — document/window are
    // unavailable during SSR/static export, so this can't be computed at
    // render time without risking a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanPlayAlpha(supportsAlphaWebm())
    setHoverCapable(prefersHoverInteraction())
  }, [])

  if (!canPlayAlpha) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={FALLBACK_SRC}
        alt="Nathamuni portrait"
        className="kinetic-portrait-fallback"
        data-testid="portrait-fallback"
      />
    )
  }

  if (!hoverCapable) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={STATIC_SRC}
        alt="Nathamuni portrait"
        className="kinetic-portrait-fallback"
        data-testid="portrait-static"
      />
    )
  }

  const handleMouseEnter = () => {
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    reverse.pause()
    reverse.style.opacity = '0'
    forward.style.opacity = '1'
    forward.currentTime = 0
    forward.play().catch(() => {})
    // Warm the reverse clip while the forward one plays, so the first
    // hover-out doesn't start from a cold, unbuffered element.
    if (reverse.preload !== 'auto') reverse.preload = 'auto'
    reverse.load()
  }

  const handleMouseLeave = () => {
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    forward.pause()
    forward.style.opacity = '0'
    reverse.style.opacity = '1'
    reverse.currentTime = 0
    reverse.play().catch(() => {})
  }

  // preload="metadata" alone doesn't paint a frame in most browsers, which
  // left the portrait invisible until playback. Seeking to the first frame
  // forces a fetch+decode of just that frame (a few hundred KB, not the
  // whole 4MB clip), so the portrait is visible immediately on load.
  const handleForwardMetadata = () => {
    const forward = forwardRef.current
    if (forward && forward.paused && forward.currentTime === 0) {
      forward.currentTime = 0.01
    }
  }

  // Runtime fallback: canPlayType can't detect alpha-channel support (there's
  // no MIME parameter for it), so a browser that decodes VP9 but can't
  // actually render the transparent video will surface it here instead.
  const handleError = () => setCanPlayAlpha(false)

  return (
    <div
      className="kinetic-portrait"
      data-testid="kinetic-portrait"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={forwardRef}
        src={FORWARD_SRC}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={handleForwardMetadata}
        onError={handleError}
        className="kinetic-portrait-video"
        data-testid="portrait-forward"
      />
      <video
        ref={reverseRef}
        src={REVERSE_SRC}
        muted
        playsInline
        preload="metadata"
        onError={handleError}
        className="kinetic-portrait-video kinetic-portrait-video-reverse"
        data-testid="portrait-reverse"
      />
    </div>
  )
}
