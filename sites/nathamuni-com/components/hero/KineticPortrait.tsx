'use client'

import { useEffect, useRef, useState } from 'react'
import { prefersHoverInteraction, supportsAlphaWebm } from '@/lib/mediaSupport'

const FORWARD_SRC = '/video/portrait-forward.webm'
const REVERSE_SRC = '/video/portrait-reverse.webm'
const FALLBACK_SRC = '/images/portrait-fallback.png'

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

  useEffect(() => {
    if (!canPlayAlpha || hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return

    let cancelled = false

    const playForward = () => {
      reverse.style.opacity = '0'
      forward.style.opacity = '1'
      forward.currentTime = 0
      forward.play().catch(() => {})
    }
    const playReverse = () => {
      forward.style.opacity = '0'
      reverse.style.opacity = '1'
      reverse.currentTime = 0
      reverse.play().catch(() => {})
    }
    const onForwardEnded = () => {
      if (!cancelled) playReverse()
    }
    const onReverseEnded = () => {
      if (!cancelled) playForward()
    }

    forward.addEventListener('ended', onForwardEnded)
    reverse.addEventListener('ended', onReverseEnded)
    playForward()

    return () => {
      cancelled = true
      forward.removeEventListener('ended', onForwardEnded)
      reverse.removeEventListener('ended', onReverseEnded)
    }
  }, [canPlayAlpha, hoverCapable])

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

  const handleMouseEnter = () => {
    if (!hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    reverse.pause()
    reverse.style.opacity = '0'
    forward.style.opacity = '1'
    forward.currentTime = 0
    forward.play().catch(() => {})
  }

  const handleMouseLeave = () => {
    if (!hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    forward.pause()
    forward.style.opacity = '0'
    reverse.style.opacity = '1'
    reverse.currentTime = 0
    reverse.play().catch(() => {})
  }

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
        preload="auto"
        className="kinetic-portrait-video"
        data-testid="portrait-forward"
      />
      <video
        ref={reverseRef}
        src={REVERSE_SRC}
        muted
        playsInline
        preload="auto"
        className="kinetic-portrait-video kinetic-portrait-video-reverse"
        data-testid="portrait-reverse"
      />
    </div>
  )
}
