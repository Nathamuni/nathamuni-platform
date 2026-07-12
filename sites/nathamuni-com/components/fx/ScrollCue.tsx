'use client'

import { useEffect, useState } from 'react'

const CSS = `
.scue-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
  transition: opacity 0.4s ease;
}
.scue-chevron {
  color: rgba(255, 255, 255, 0.35);
  animation: scue-float 2s ease-in-out infinite;
}
@keyframes scue-float {
  0%, 100% { transform: translateY(0); opacity: 0.35; }
  50% { transform: translateY(6px); opacity: 0.6; }
}
.scue-wrap.scue-hidden {
  opacity: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .scue-wrap {
    display: none;
  }
}
`

/**
 * Homepage-only chevron-down cue under the hero, gently floating to invite
 * scrolling. Fades out for good the first time the visitor scrolls past
 * 80px — it never reappears, even on scroll-up. Hidden entirely under
 * prefers-reduced-motion.
 */
export function ScrollCue() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setDismissed(true)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={dismissed ? 'scue-wrap scue-hidden' : 'scue-wrap'}
      aria-hidden="true"
      data-testid="scroll-cue"
    >
      <style>{CSS}</style>
      <svg className="scue-chevron" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
