'use client'

import { useEffect, useRef } from 'react'

const CSS = `
.sprg-track {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 50;
  pointer-events: none;
  background: transparent;
}
.sprg-fill {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  transform: scaleX(0);
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee);
}
@media (prefers-reduced-motion: reduce) {
  .sprg-track {
    display: none;
  }
}
`

/**
 * A slim hairline at the very top of the viewport that fills, left to
 * right, with the fraction of the document scrolled — a violet→magenta→cyan
 * gradient bar. Pure visual chrome: aria-hidden, pointer-events: none, and
 * fully removed under prefers-reduced-motion.
 */
export function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef(0)
  const tickingRef = useRef(false)

  useEffect(() => {
    const update = () => {
      tickingRef.current = false
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const fraction = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${fraction})`
      }
    }

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      rafRef.current = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="sprg-track" aria-hidden="true" data-testid="scroll-progress">
      <style>{CSS}</style>
      <div ref={fillRef} className="sprg-fill" data-testid="scroll-progress-fill" />
    </div>
  )
}
