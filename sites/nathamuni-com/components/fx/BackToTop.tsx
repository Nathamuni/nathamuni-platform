'use client'

import { useEffect, useState } from 'react'

// Companion's picker button (components/fx/Companion.tsx: .cmp-picker-wrap)
// sits at right:16 bottom:16 (desktop) / right:16 bottom:88 (mobile, above
// the tab bar) and is 44px tall. BackToTop stacks directly above it with a
// 12px gap, sharing the same right offset so the two read as one column.
// If Companion's position ever changes, these numbers need to move with it.
const DESKTOP_BOTTOM = 16 + 44 + 12 // 72
const MOBILE_BOTTOM = 88 + 44 + 12 // 144
const SHOW_AFTER_VIEWPORTS = 2

const CSS = `
.btt-btn {
  position: fixed;
  right: 16px;
  bottom: ${DESKTOP_BOTTOM}px;
  z-index: 45;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(139, 92, 246, 0.35);
  background: rgba(13, 10, 31, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(139, 92, 246, 0.35);
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease, box-shadow 0.15s ease;
}
.btt-btn.btt-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.btt-btn:hover {
  box-shadow: 0 6px 22px rgba(236, 72, 153, 0.4);
}
@media (max-width: 639px) {
  .btt-btn {
    bottom: ${MOBILE_BOTTOM}px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .btt-btn {
    transition: none;
  }
}
`

/**
 * A small glass "back to top" button that fades in once the visitor has
 * scrolled past two viewport heights, and smooth-scrolls (instant jump
 * under reduced-motion) back to the top on click.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * SHOW_AFTER_VIEWPORTS)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const handleClick = () => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      <style>{CSS}</style>
      <button
        type="button"
        className={visible ? 'btt-btn btt-visible' : 'btt-btn'}
        aria-label="Back to top"
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        onClick={handleClick}
        data-testid="back-to-top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 15L12 9L18 15"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  )
}
