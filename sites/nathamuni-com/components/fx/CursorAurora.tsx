'use client'

import { useEffect, useRef } from 'react'

/**
 * Homepage-only atmosphere layer: a soft violet→magenta→cyan glow that
 * eases toward the cursor (rAF + lerp) with a slower, fainter echo trailing
 * behind it. Fixed, full-viewport, pointer-events-none — pure ambience,
 * never intercepts clicks.
 *
 * Desktop-only by design: bails out (and stays invisible) unless the
 * pointer is fine + hoverable and the user hasn't asked for reduced motion.
 */
export function CursorAurora() {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const echoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const container = containerRef.current
    if (!fine || reduced || !container) return

    container.style.opacity = '1'

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let glowX = targetX
    let glowY = targetY
    let echoX = targetX
    let echoY = targetY
    let hue = 262
    let raf = 0

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }
    window.addEventListener('pointermove', onMove)

    const tick = () => {
      glowX += (targetX - glowX) * 0.12
      glowY += (targetY - glowY) * 0.12
      echoX += (targetX - echoX) * 0.05
      echoY += (targetY - echoY) * 0.05
      hue = (hue + 0.12) % 360

      const glow = glowRef.current
      const echo = echoRef.current
      if (glow) {
        glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`
        glow.style.background = `radial-gradient(circle, hsla(${hue}, 90%, 65%, 0.55), hsla(${(hue + 70) % 360}, 90%, 60%, 0.22) 45%, transparent 70%)`
      }
      if (echo) {
        echo.style.transform = `translate3d(${echoX}px, ${echoY}px, 0) translate(-50%, -50%)`
        echo.style.background = `radial-gradient(circle, hsla(${(hue + 190) % 360}, 90%, 65%, 0.32), transparent 70%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div ref={containerRef} className="cursor-aurora" aria-hidden="true" data-testid="cursor-aurora">
      <div ref={echoRef} className="cursor-aurora-echo" />
      <div ref={glowRef} className="cursor-aurora-glow" />
    </div>
  )
}
