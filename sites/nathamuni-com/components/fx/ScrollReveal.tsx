'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Progressive scroll-entrance system: any element with [data-reveal] fades
 * up as it enters the viewport. Re-scans on every route change — without
 * that, client-side navigation would leave new pages' sections unobserved
 * and therefore stuck invisible at opacity 0 (P0 found on /books).
 * No-ops for prefers-reduced-motion (CSS keeps those elements visible).
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const els = document.querySelectorAll('[data-reveal]:not(.is-visible)')
    if (!('IntersectionObserver' in window)) {
      // Ancient browser: never leave content hidden.
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
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
  }, [pathname])

  return null
}
