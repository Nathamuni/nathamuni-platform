'use client'

import { useEffect } from 'react'

/**
 * Progressive scroll-entrance system: any element with [data-reveal] fades
 * up as it enters the viewport. Works on mobile (unlike hover effects),
 * costs one IntersectionObserver, and no-ops for prefers-reduced-motion
 * (CSS keeps those elements fully visible).
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
    const els = document.querySelectorAll('[data-reveal]:not(.is-visible)')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
