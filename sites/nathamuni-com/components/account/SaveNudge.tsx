'use client'

import { useEffect, useState } from 'react'
import { useOptionalAuth } from './AuthProvider'

const DISMISS_KEY = 'nm-nudge-dismissed'

/** Fired here, handled by AccountWidget: opens the save-progress dialog. */
export const OPEN_ACCOUNT_EVENT = 'nm-open-account'

/**
 * One inline line shown right where a visitor just logged real data:
 * their progress currently lives only in this browser — one click opens the
 * account dialog to keep it. Signed-in visitors, accounts-unavailable mode,
 * and anyone who dismissed it once never see it again. `show` is the
 * "earned it" signal from the tracker (they actually did something).
 */
export function SaveNudge({ show }: { show: boolean }) {
  const auth = useOptionalAuth()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setDismissed(window.localStorage?.getItem(DISMISS_KEY) === '1')
  }, [])

  // No provider (isolated render), still resolving, signed in, accounts
  // down, unearned, or dismissed — all mean stay out of the way.
  if (!auth || !show || auth.loading || auth.authed || !auth.available || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* privacy mode — dismissal lasts this page only */
    }
  }

  return (
    <div className="nudge" data-testid="save-nudge" role="note">
      <span className="nudge-text">This progress lives only in this browser.</span>
      <button
        type="button"
        className="nudge-cta"
        onClick={() => window.dispatchEvent(new Event(OPEN_ACCOUNT_EVENT))}
      >
        Keep it on any device
      </button>
      <button type="button" className="nudge-dismiss" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>

      <style>{`
        .nudge {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          padding: 0.55rem 0.8rem;
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.35);
          background: rgba(139, 92, 246, 0.1);
          font-size: 0.8rem;
        }
        .nudge-text { color: rgba(255, 255, 255, 0.7); }
        .nudge-cta {
          border: none;
          background: none;
          padding: 0;
          color: #a78bfa;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .nudge-dismiss {
          margin-left: auto;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          padding: 0 0.2rem;
        }
        .nudge-dismiss:hover { color: rgba(255, 255, 255, 0.8); }
      `}</style>
    </div>
  )
}
