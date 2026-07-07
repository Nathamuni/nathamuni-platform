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

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
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
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
        el.style.setProperty('--glare-o', '0')
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
    <div ref={ref} className="tilt-card" data-testid="tilt-card">
      {children}
      <span className="tilt-glare" aria-hidden />
    </div>
  )
}
