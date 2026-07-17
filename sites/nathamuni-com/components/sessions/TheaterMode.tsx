'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Step } from '@/lib/sessions'
import { loadItem, saveItem } from '@/lib/progress'
import { CredibilityBadge } from './CredibilityBadge'

const ENTRY_MS = 3000

function storageKey(slug: string): string {
  return `session-${slug}`
}

function loadCompleted(slug: string, count: number): boolean[] {
  try {
    const raw = loadItem(storageKey(slug))
    if (!raw) return new Array(count).fill(false)
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return new Array(count).fill(false).map((_, i) => Boolean(parsed[i]))
    }
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  return new Array(count).fill(false)
}

/**
 * Fullscreen one-step-at-a-time focus overlay. Shares the `session-<slug>`
 * boolean[] with StepTracker (dispatching `nm-session-steps-changed` so the
 * list rehydrates). Fullscreen and Wake Lock are progressive enhancements —
 * both feature-detected, both failures swallowed; the fixed-position overlay
 * itself is the iOS-Safari fallback. The ambient glow is a static hue
 * gradient: no motion, so nothing to gate on prefers-reduced-motion.
 */
export function TheaterMode({ slug, hue, steps }: { slug: string; hue: number; steps: Step[] }) {
  const [open, setOpen] = useState(false)
  const [settled, setSettled] = useState(false)
  const [completed, setCompleted] = useState<boolean[]>(() => new Array(steps.length).fill(false))
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  const acquireWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: {
          request: (type: 'screen') => Promise<
            { release: () => Promise<void> } & EventTarget
          >
        }
      }
      if (nav.wakeLock) {
        const sentinel = await nav.wakeLock.request('screen')
        wakeLockRef.current = sentinel
        // The browser auto-releases the sentinel (e.g. on tab hide) and fires
        // 'release' on it without us calling release() — null the ref so the
        // visibilitychange handler's re-acquire guard can fire again.
        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) wakeLockRef.current = null
        })
      }
    } catch {
      /* unsupported or denied — the session works without it */
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setSettled(false)
    setReviewIndex(null)
    void wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    document.body.style.overflow = ''
  }, [])

  function enter() {
    setCompleted(loadCompleted(slug, steps.length))
    setOpen(true)
    document.body.style.overflow = 'hidden'
    void overlayRef.current // fullscreen requested in the effect below, after the overlay exists
  }

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setSettled(true), ENTRY_MS)
    if (overlayRef.current?.requestFullscreen) {
      overlayRef.current.requestFullscreen().catch(() => {})
    }
    void acquireWakeLock()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) void acquireWakeLock()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('keydown', onKey)
      // Guaranteed teardown even on unmount (route change, back button) while
      // the overlay is open — same cleanup close() performs.
      void wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      document.body.style.overflow = ''
    }
  }, [open, acquireWakeLock, close])

  function markCurrentDone() {
    setCompleted((prev) => {
      const index = prev.findIndex((done) => !done)
      if (index === -1) return prev
      const next = prev.slice()
      next[index] = true
      saveItem(storageKey(slug), JSON.stringify(next))
      window.dispatchEvent(new Event('nm-session-steps-changed'))
      return next
    })
  }

  const firstUnchecked = completed.findIndex((done) => !done)
  const allDone = firstUnchecked === -1
  // Reviewing = browsing an already-finished protocol; never mutates checks.
  const reviewing = allDone && reviewIndex !== null
  const currentIndex = reviewing ? reviewIndex : firstUnchecked
  const step = currentIndex >= 0 && currentIndex < steps.length ? steps[currentIndex] : null
  const doneCount = completed.filter(Boolean).length

  return (
    <>
      <button type="button" className="ssn-theater-open" onClick={enter}>
        ⛶ Focus mode
      </button>

      {open && (
        <div
          ref={overlayRef}
          className="ssn-theater"
          role="dialog"
          aria-modal="true"
          aria-label="Session focus mode"
          style={{ '--cat': hue } as React.CSSProperties}
        >
          {!settled ? (
            <div className="ssn-theater-entry">
              <p className="ssn-theater-entry-title">Settle in.</p>
              <p className="ssn-theater-entry-sub">One step at a time. Nothing else.</p>
            </div>
          ) : reviewing && step ? (
            <div className="ssn-theater-step">
              <p className="ssn-theater-count tabular-nums">
                Reviewing · step {currentIndex + 1} of {steps.length}
              </p>
              <div className="ssn-theater-head">
                <h3 className="ssn-theater-title">{step.title}</h3>
                <CredibilityBadge label={step.label} />
              </div>
              <p className="ssn-theater-detail">{step.detail}</p>
              <p className="ssn-theater-checkpoint">Done when: {step.checkpoint}</p>
              <div className="ssn-theater-nav">
                <button
                  type="button"
                  className="ssn-theater-back"
                  disabled={currentIndex === 0}
                  onClick={() => setReviewIndex(currentIndex - 1)}
                >
                  ← Back
                </button>
                {currentIndex < steps.length - 1 ? (
                  <button
                    type="button"
                    className="ssn-theater-done"
                    onClick={() => setReviewIndex(currentIndex + 1)}
                  >
                    Next →
                  </button>
                ) : (
                  <button type="button" className="ssn-theater-done" onClick={close}>
                    Finish
                  </button>
                )}
              </div>
            </div>
          ) : allDone ? (
            <div className="ssn-theater-step">
              <p className="ssn-theater-count">Protocol complete</p>
              <h3 className="ssn-theater-title">Every step is done. Well run.</h3>
              <div className="ssn-theater-nav">
                <button type="button" className="ssn-theater-done" onClick={() => setReviewIndex(0)}>
                  Review the steps
                </button>
                <button type="button" className="ssn-theater-back" onClick={close}>
                  Finish
                </button>
              </div>
            </div>
          ) : (
            step && (
              <div className="ssn-theater-step">
                <p className="ssn-theater-count tabular-nums">
                  Step {currentIndex + 1} of {steps.length} · {doneCount} done
                </p>
                <div className="ssn-theater-head">
                  <h3 className="ssn-theater-title">{step.title}</h3>
                  <CredibilityBadge label={step.label} />
                </div>
                <p className="ssn-theater-detail">{step.detail}</p>
                <p className="ssn-theater-checkpoint">Done when: {step.checkpoint}</p>
                <button type="button" className="ssn-theater-done" onClick={markCurrentDone}>
                  Done — next step
                </button>
              </div>
            )
          )}
          <button type="button" className="ssn-theater-exit" onClick={close}>
            Exit
          </button>

          <style>{`
            .ssn-theater {
              position: fixed;
              inset: 0;
              z-index: 100;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1.5rem;
              background: #0d0a1f;
            }
            /* Breathing dark gradient: two hued glows slowly swelling and
               relaxing on an ~8s cycle — calm, not weather. Sits behind the
               content and is fully disabled under prefers-reduced-motion. */
            .ssn-theater::before {
              content: '';
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(120% 90% at 50% 110%, hsla(var(--cat), 70%, 40%, 0.28), transparent 60%),
                radial-gradient(100% 70% at 50% -20%, hsla(var(--cat), 80%, 55%, 0.16), transparent 55%);
              animation: ssn-theater-breathe 8s ease-in-out infinite;
            }
            @keyframes ssn-theater-breathe {
              0%, 100% { opacity: 0.55; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.06); }
            }
            .ssn-theater-step,
            .ssn-theater-entry,
            .ssn-theater-exit {
              position: relative;
              z-index: 1;
            }
            .ssn-theater-entry {
              text-align: center;
              animation: ssn-theater-fade 1.2s ease both;
            }
            .ssn-theater-entry-title {
              margin: 0 0 0.5rem;
              font-size: 1.6rem;
              font-weight: 800;
              color: #fff;
            }
            .ssn-theater-entry-sub {
              margin: 0;
              font-size: 0.95rem;
              color: rgba(255, 255, 255, 0.55);
            }
            .ssn-theater-step {
              max-width: 34rem;
              display: flex;
              flex-direction: column;
              gap: 1rem;
              animation: ssn-theater-fade 0.8s ease both;
            }
            .ssn-theater-count {
              margin: 0;
              font-size: 0.68rem;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: hsl(var(--cat) 85% 70%);
            }
            .ssn-theater-head {
              display: flex;
              align-items: center;
              gap: 0.7rem;
              flex-wrap: wrap;
            }
            .ssn-theater-title {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 800;
              color: #fff;
            }
            .ssn-theater-detail {
              margin: 0;
              font-size: 1rem;
              line-height: 1.7;
              color: rgba(255, 255, 255, 0.78);
            }
            .ssn-theater-checkpoint {
              margin: 0;
              font-size: 0.85rem;
              color: rgba(255, 255, 255, 0.6);
            }
            .ssn-theater-done {
              align-self: flex-start;
              padding: 0.75rem 1.4rem;
              border-radius: 0.85rem;
              border: none;
              background: hsl(var(--cat) 80% 62%);
              color: #0d0a1f;
              font-size: 0.95rem;
              font-weight: 700;
              cursor: pointer;
            }
            .ssn-theater-exit {
              position: absolute;
              top: max(1rem, env(safe-area-inset-top));
              right: max(1rem, env(safe-area-inset-right));
              padding: 0.45rem 0.9rem;
              border-radius: 9999px;
              border: 1px solid rgba(255, 255, 255, 0.25);
              background: none;
              color: rgba(255, 255, 255, 0.6);
              font-size: 0.75rem;
              cursor: pointer;
            }
            @keyframes ssn-theater-fade {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: none; }
            }
            .ssn-theater-nav {
              display: flex;
              align-items: center;
              gap: 0.7rem;
              flex-wrap: wrap;
            }
            .ssn-theater-back {
              padding: 0.75rem 1.4rem;
              border-radius: 0.85rem;
              border: 1px solid rgba(255, 255, 255, 0.25);
              background: none;
              color: rgba(255, 255, 255, 0.75);
              font-size: 0.95rem;
              font-weight: 600;
              cursor: pointer;
            }
            .ssn-theater-back:disabled {
              opacity: 0.35;
              cursor: default;
            }
            @media (prefers-reduced-motion: reduce) {
              .ssn-theater-entry,
              .ssn-theater-step {
                animation: none;
              }
              .ssn-theater::before {
                animation: none;
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      <style>{`
        .ssn-theater-open {
          padding: 0.6rem 1.15rem;
          border-radius: 9999px;
          border: none;
          background: linear-gradient(135deg, #f59e0b, #ec4899 55%, #8b5cf6);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(236, 72, 153, 0.35);
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .ssn-theater-open:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(236, 72, 153, 0.5);
        }
        .ssn-theater-open:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .ssn-theater-open,
          .ssn-theater-open:hover {
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </>
  )
}
