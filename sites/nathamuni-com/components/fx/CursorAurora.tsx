'use client'

import { useEffect, useRef } from 'react'

// Capped well below full strength: the layer sits *behind* content per the
// stacking rules below, but a fixed z-index:0 sibling can still end up
// painted above plain unpositioned text nodes (positioned/stacking-context
// descendants paint after non-positioned in-flow ones in the CSS painting
// order — see CSS2.1 Appendix E, step 6 vs step 3). We cannot change layout
// structure here, so the robust mitigation is to keep this faint enough
// that even a worst-case overlap never obscures text.
const ACTIVE_OPACITY = 0.32
// Slow hue sweep confined to violet→magenta→cyan (not a full rainbow).
const HUE_MIN = 190 // cyan
const HUE_MAX = 320 // magenta (sweep passes through ~262 violet mid-way)

/**
 * Homepage-only atmosphere layer: a tight, comet-style violet→magenta→cyan
 * glow that eases toward the cursor (rAF + lerp) with a fainter echo
 * trailing behind it. Fixed, full-viewport, pointer-events-none, and
 * rendered *behind* page content (z-index: 0, no blend mode) — pure
 * ambience, never intercepts clicks and never washes out text.
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

    container.style.opacity = String(ACTIVE_OPACITY)

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let glowX = targetX
    let glowY = targetY
    let echoX = targetX
    let echoY = targetY
    let phase = 0
    let raf = 0

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }
    window.addEventListener('pointermove', onMove)

    const tick = () => {
      glowX += (targetX - glowX) * 0.14
      glowY += (targetY - glowY) * 0.14
      echoX += (targetX - echoX) * 0.05
      echoY += (targetY - echoY) * 0.05
      phase += 0.0035

      const sweep = (Math.sin(phase) + 1) / 2
      const hue = HUE_MIN + sweep * (HUE_MAX - HUE_MIN)
      const echoSweep = (Math.sin(phase - 0.9) + 1) / 2
      const echoHue = HUE_MIN + echoSweep * (HUE_MAX - HUE_MIN)

      const glow = glowRef.current
      const echo = echoRef.current
      if (glow) {
        glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`
        glow.style.background = `radial-gradient(circle, hsla(${hue}, 92%, 62%, 0.9), hsla(${(hue + 30) % 360}, 92%, 55%, 0.35) 45%, transparent 72%)`
      }
      if (echo) {
        echo.style.transform = `translate3d(${echoX}px, ${echoY}px, 0) translate(-50%, -50%)`
        echo.style.background = `radial-gradient(circle, hsla(${echoHue}, 85%, 60%, 0.5), transparent 70%)`
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
