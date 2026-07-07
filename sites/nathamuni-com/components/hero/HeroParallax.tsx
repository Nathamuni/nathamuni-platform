'use client'

import { useEffect, useRef } from 'react'

/**
 * Renders the hero section with pointer-parallax depth: floating gradient
 * orbs and the portrait drift subtly against the copy as the cursor moves.
 * Touch devices and reduced-motion users get the static composition.
 */
export function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    let raf = 0
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--par-x', x.toFixed(3))
        el.style.setProperty('--par-y', y.toFixed(3))
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--par-x', '0')
        el.style.setProperty('--par-y', '0')
      })
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section ref={ref} className="hero" data-testid="hero-section">
      <span className="hero-orb hero-orb-1" aria-hidden />
      <span className="hero-orb hero-orb-2" aria-hidden />
      <span className="hero-orb hero-orb-3" aria-hidden />
      {children}
    </section>
  )
}
