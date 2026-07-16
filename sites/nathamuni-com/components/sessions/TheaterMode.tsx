'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Step } from '@/lib/sessions'
import { loadItem, saveItem } from '@/lib/progress'
import { CredibilityBadge } from './CredibilityBadge'

const ENTRY_MS = 4000

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
  const overlayRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  const acquireWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
      }
      if (nav.wakeLock) wakeLockRef.current = await nav.wakeLock.request('screen')
    } catch {
      /* unsupported or denied — the session works without it */
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setSettled(false)
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

  const currentIndex = completed.findIndex((done) => !done)
  const allDone = currentIndex === -1
  const step = allDone ? null : steps[currentIndex]
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
          ) : allDone ? (
            <div className="ssn-theater-step">
              <p className="ssn-theater-count">Protocol complete</p>
              <h3 className="ssn-theater-title">Every step is done. Well run.</h3>
              <button type="button" className="ssn-theater-done" onClick={close}>
                Finish
              </button>
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
              background:
                radial-gradient(120% 90% at 50% 110%, hsla(var(--cat), 70%, 40%, 0.22), transparent 60%),
                radial-gradient(100% 70% at 50% -20%, hsla(var(--cat), 80%, 55%, 0.12), transparent 55%),
                #0d0a1f;
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
            @media (prefers-reduced-motion: reduce) {
              .ssn-theater-entry,
              .ssn-theater-step {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      <style>{`
        .ssn-theater-open {
          padding: 0.55rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .ssn-theater-open:hover {
          border-color: hsla(var(--cat), 70%, 60%, 0.6);
        }
      `}</style>
    </>
  )
}
