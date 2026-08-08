'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Progressive scroll-entrance system: any element with [data-reveal] fades
 * up as it enters the viewport. Re-scans on every route change — without
 * that, client-side navigation would leave new pages' sections unobserved
 * and therefore stuck invisible at opacity 0 (P0 found on /books).
 *
 * Also watches the DOM for [data-reveal] elements that mount *after* the
 * initial scan — e.g. a client component whose content arrives from an
 * async fetch (VideoSections rendering post-videos.json). Without this,
 * those sections' data-reveal never gets observed and they stay stuck at
 * opacity 0 forever, since the one-time querySelectorAll ran before they
 * existed.
 *
 * No-ops for prefers-reduced-motion (CSS keeps those elements visible).
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!('IntersectionObserver' in window)) {
      // Ancient browser: never leave content hidden, present or future.
      const revealAll = () =>
        document
          .querySelectorAll('[data-reveal]:not(.is-visible)')
          .forEach((el) => el.classList.add('is-visible'))
      revealAll()
      const fallbackMo = new MutationObserver(revealAll)
      fallbackMo.observe(document.body, { childList: true, subtree: true })
      return () => fallbackMo.disconnect()
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

    const observeNew = () => {
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el))
    }
    observeNew()

    // Watching the whole body subtree means a burst of DOM changes (a client island
    // hydrating, a list re-rendering) would each trigger a full-document
    // querySelectorAll. Coalesce to one scan per frame.
    let scanQueued = false
    const queueScan = () => {
      if (scanQueued) return
      scanQueued = true
      requestAnimationFrame(() => {
        scanQueued = false
        observeNew()
      })
    }

    const mo = new MutationObserver(queueScan)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}
