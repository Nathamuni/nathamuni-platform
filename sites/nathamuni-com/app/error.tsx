'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Branded client-side error boundary. Without this, a runtime error drops the
 * visitor onto Next's unstyled default screen — jarring against the rest of
 * the site. Keeps the failure honest (no fake reassurance) and offers a way out.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface it in the console for anyone debugging from the browser.
    console.error('Page error:', error)
  }, [error])

  return (
    <section className="section">
      <header className="pg-head" style={{ '--pg-hue': 38 } as React.CSSProperties}>
        <span className="pg-head-eyebrow">Something broke</span>
        <h1 className="pg-head-title">This page hit an error.</h1>
        <p className="pg-head-lede">
          Not your fault — something in the page failed to load. Trying again usually clears it.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="glass-card px-5 py-2.5 text-sm text-white transition-colors hover:border-white/30"
        >
          Try again
        </button>
        <Link
          href="/"
          className="glass-card px-5 py-2.5 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Back home
        </Link>
      </div>

      {error.digest && (
        <p className="text-[0.7rem] text-white/30 mt-6">Reference: {error.digest}</p>
      )}
    </section>
  )
}
