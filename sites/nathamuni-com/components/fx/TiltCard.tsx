'use client'

import { useEffect, useRef } from 'react'

const MAX_TILT_DEG = 7

/**
 * Wraps children in a pointer-tracked 3D tilt with a moving glare highlight.
 * Desktop-only by design: touch devices and reduced-motion users get a
 * plain, static wrapper (the inner card keeps its own hover styles).
 */
export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    let raf = 0
    // Cached on enter instead of read per pointermove. Two reasons: a rect read per
    // move forces layout on every event, and getBoundingClientRect() reflects the
    // transform this handler applies — so reading it live feeds the tilt back into
    // itself. Position only changes on scroll/resize, so refresh it there.
    let rect: DOMRect | null = null
    const refreshRect = () => {
      rect = el.getBoundingClientRect()
    }

    const onEnter = () => {
      refreshRect()
      window.addEventListener('scroll', refreshRect, { passive: true })
      window.addEventListener('resize', refreshRect, { passive: true })
    }

    const onMove = (e: PointerEvent) => {
      if (!rect) refreshRect()
      if (!rect) return
      const px = (e.clientX - rect.left) / rect.width // 0..1
      const py = (e.clientY - rect.top) / rect.height
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rx = (0.5 - py) * MAX_TILT_DEG
        const ry = (px - 0.5) * MAX_TILT_DEG
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
        el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`)
        el.style.setProperty('--glare-o', '1')
      })
    }

    const onLeave = () => {
      rect = null
      window.removeEventListener('scroll', refreshRect)
      window.removeEventListener('resize', refreshRect)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
        el.style.setProperty('--glare-o', '0')
      })
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', refreshRect)
      window.removeEventListener('resize', refreshRect)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className="tilt-card" data-testid="tilt-card">
      {children}
      <span className="tilt-glare" aria-hidden />
    </div>
  )
}
