'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  duration?: number
  className?: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Animates 0 → value once the span first scrolls into view (or on mount, if
 * IntersectionObserver isn't available). Renders the final value up front so
 * SSR / no-JS / crawlers always see the real number — the tween is a
 * progressive enhancement layered on top via a client-only effect.
 */
export function CountUp({ value, duration = 1200, className }: CountUpProps) {
  const [display, setDisplay] = useState(value)
  const spanRef = useRef<HTMLSpanElement | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const runTween = () => {
      if (startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      setDisplay(0)
      const step = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, duration <= 0 ? 1 : elapsed / duration)
        setDisplay(Math.round(easeOutCubic(t) * value))
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      // Initial state already equals `value` — nothing to animate, nothing to set.
      startedRef.current = true
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runTween()
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span
      ref={spanRef}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      data-testid="count-up"
    >
      {display.toLocaleString()}
    </span>
  )
}
