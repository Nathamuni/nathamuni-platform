'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { TimelinePhase } from '@/lib/sessions'
import {
  activePhaseIndex,
  clearStartDate,
  dayOfSession,
  loadStartDate,
  localIsoDate,
  saveStartDate,
} from '@/lib/sessionRun'
import { earnSaveNudge } from '@/components/account/SaveNudge'
import { SessionTimeline } from './SessionTimeline'

/**
 * Makes a session runnable: Start button → start date in localStorage →
 * "Day N · Phase" positioning on the timeline. Renders the not-started shell
 * on SSR and first client paint (date math only after mount) so hydration
 * never mismatches — "Day N" depends on the visitor's clock.
 */
export function SessionRunner({
  slug,
  hue,
  durationLabel,
  timeline,
  children,
}: {
  slug: string
  hue: number
  durationLabel: string
  timeline: TimelinePhase[]
  children?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [startedOn, setStartedOn] = useState<string | null>(null)

  const rehydrate = useCallback(() => setStartedOn(loadStartDate(slug)), [slug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setMounted(true)
    rehydrate()
  }, [rehydrate])

  useEffect(() => {
    window.addEventListener('nm-progress-applied', rehydrate)
    return () => window.removeEventListener('nm-progress-applied', rehydrate)
  }, [rehydrate])

  function start() {
    const today = localIsoDate()
    saveStartDate(slug, today)
    setStartedOn(today)
    earnSaveNudge()
    window.dispatchEvent(new Event('nm-session-started'))
  }

  function restart() {
    if (!window.confirm('Restart this session? Your start date resets (step checks are kept).')) return
    clearStartDate(slug)
    setStartedOn(null)
  }

  const day = mounted && startedOn ? dayOfSession(startedOn) : null
  const active = day !== null ? activePhaseIndex(timeline, day) : -1
  const phaseName = active >= 0 ? timeline[active].phase : null

  return (
    <div className="ssn-runner" data-testid="session-runner">
      <div className="ssn-runner-bar">
        {day === null ? (
          <button type="button" className="ssn-runner-start" onClick={start}>
            ▶ Start this session
            <span className="ssn-runner-start-sub">{durationLabel} · tracked in your browser</span>
          </button>
        ) : (
          <p className="ssn-runner-status" role="status" aria-live="polite">
            <span className="ssn-runner-day tabular-nums">Day {day}</span>
            {phaseName && <span className="ssn-runner-phase">· {phaseName}</span>}
            <button type="button" className="ssn-runner-restart" onClick={restart}>
              restart
            </button>
          </p>
        )}
        {children}
      </div>
      <SessionTimeline hue={hue} timeline={timeline} activeIndex={active >= 0 ? active : undefined} />
      <style>{`
        .ssn-runner {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .ssn-runner-bar {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-wrap: wrap;
        }
        .ssn-runner-start {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
          padding: 0.7rem 1.2rem;
          border-radius: 0.85rem;
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.5);
          background: hsla(var(--cat), 70%, 55%, 0.14);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .ssn-runner-start:hover {
          background: hsla(var(--cat), 70%, 55%, 0.24);
        }
        .ssn-runner-start-sub {
          font-size: 0.68rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.55);
        }
        .ssn-runner-status {
          margin: 0;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ssn-runner-day {
          font-size: 1.15rem;
          font-weight: 800;
          color: hsl(var(--cat) 85% 70%);
        }
        .ssn-runner-phase {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .ssn-runner-restart {
          border: none;
          background: none;
          padding: 0;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .ssn-runner-restart:hover {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  )
}
