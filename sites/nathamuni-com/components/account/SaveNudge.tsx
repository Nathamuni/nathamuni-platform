'use client'

import { useEffect, useRef, useState } from 'react'
import { useOptionalAuth } from './AuthProvider'

const DISMISS_KEY = 'nm-nudge-dismissed'
const SESSION_KEY = 'nm-nudge-shown'
const EARN_EVENT = 'nm-nudge-earned'
const AUTO_HIDE_MS = 12_000

/**
 * Trackers call this the moment a visitor has done real work (2+ steps
 * checked, a metric logged). The single SaveNudgeHost decides whether the
 * overlay actually appears — so five trackers earning at once still means
 * exactly one toast.
 */
export function earnSaveNudge(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EARN_EVENT))
}

/**
 * One global, non-disturbing overlay: a small glass toast that slides up
 * from the bottom when progress worth keeping exists. It never shifts page
 * layout, auto-hides after 12s, shows at most once per browser session, and
 * the × dismisses it forever. The CTA opens the account dialog.
 */
export function SaveNudgeHost() {
  const auth = useOptionalAuth()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onEarned() {
      try {
        if (window.localStorage.getItem(DISMISS_KEY) === '1') return
        if (window.sessionStorage.getItem(SESSION_KEY) === '1') return
      } catch {
        /* storage unavailable — still show, just without memory */
      }
      setVisible((already) => {
        if (already) return already
        try {
          window.sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
          /* fine */
        }
        return true
      })
    }
    window.addEventListener(EARN_EVENT, onEarned)
    return () => window.removeEventListener(EARN_EVENT, onEarned)
  }, [])

  // Gentle exit: fade/slide out, then unmount.
  function hide() {
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
    }, 250)
  }

  useEffect(() => {
    if (!visible) return
    hideTimer.current = setTimeout(hide, AUTO_HIDE_MS)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [visible])

  if (!auth || auth.loading || auth.authed || !auth.available || !visible) return null

  function dismissForever() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* privacy mode — dismissal lasts this session only */
    }
    hide()
  }

  function openAccount() {
    window.dispatchEvent(new Event('nm-open-account'))
    hide()
  }

  return (
    <div
      className={`nudge-toast${leaving ? ' nudge-toast-leaving' : ''}`}
      data-testid="save-nudge"
      role="status"
      aria-live="polite"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="nudge-toast-icon"
      >
        <path d="M17.5 19a4.5 4.5 0 0 0 .42-8.98 6 6 0 0 0-11.7 1.62A3.5 3.5 0 0 0 6.5 19Z" />
        <path d="M12 12v5M9.8 14.2 12 12l2.2 2.2" />
      </svg>
      <div className="nudge-toast-body">
        <span className="nudge-toast-text">
          This progress exists only in this browser — one cleared cache and it&apos;s gone.
        </span>
        <button type="button" className="nudge-toast-cta" onClick={openAccount}>
          Keep it on any device
        </button>
      </div>
      <button
        type="button"
        className="nudge-toast-dismiss"
        aria-label="Don't show this again"
        onClick={dismissForever}
      >
        ×
      </button>

      <style>{`
        .nudge-toast {
          position: fixed;
          left: 50%;
          bottom: calc(76px + env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          max-width: min(92vw, 26rem);
          padding: 0.7rem 0.9rem;
          border-radius: 16px;
          border: 1px solid rgba(178, 148, 255, 0.35);
          background: rgba(23, 16, 48, 0.92);
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 50px -12px rgba(139, 92, 246, 0.45);
          animation: nudge-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (min-width: 640px) {
          .nudge-toast {
            left: auto;
            right: 20px;
            bottom: 20px;
            transform: none;
          }
        }
        .nudge-toast-leaving {
          opacity: 0;
          transition: opacity 0.25s ease-in, transform 0.25s ease-in;
          transform: translateX(-50%) translateY(10px);
        }
        @media (min-width: 640px) {
          .nudge-toast-leaving {
            transform: translateY(10px);
          }
        }
        .nudge-toast-icon {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          color: #a78bfa;
        }
        .nudge-toast-body {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .nudge-toast-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .nudge-toast-cta {
          align-self: flex-start;
          border: none;
          background: none;
          padding: 0;
          color: #22d3ee;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .nudge-toast-dismiss {
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
          padding: 0.3rem;
          margin-left: 0.1rem;
        }
        .nudge-toast-dismiss:hover {
          color: rgba(255, 255, 255, 0.85);
        }
        @keyframes nudge-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        @media (min-width: 640px) {
          @keyframes nudge-in {
            from {
              opacity: 0;
              transform: translateY(24px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .nudge-toast {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
