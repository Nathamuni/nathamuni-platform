'use client'

import { useCallback, useEffect, useState } from 'react'
import { stepAnchorId, type Step } from '@/lib/sessions'
import { loadItem, saveItem } from '@/lib/progress'
import { earnSaveNudge } from '@/components/account/SaveNudge'
import { CredibilityBadge } from './CredibilityBadge'
import { StepExample } from './StepExample'

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
    /* localStorage unavailable (privacy mode) or corrupt — start fresh */
  }
  return new Array(count).fill(false)
}

/**
 * The vertical numbered protocol + its interactive checklist. Renders
 * identically on server and on first client paint (all steps unchecked, no
 * localStorage read yet) so hydration never mismatches; the saved state
 * loads in a useEffect right after mount and only then re-renders checked.
 */
export function StepTracker({ slug, steps }: { slug: string; steps: Step[] }) {
  const [mounted, setMounted] = useState(false)
  const [completed, setCompleted] = useState<boolean[]>(() => new Array(steps.length).fill(false))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setMounted(true)
    setCompleted(loadCompleted(slug, steps.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- steps.length is stable per session slug.
  }, [slug])

  const rehydrate = useCallback(() => {
    setCompleted(loadCompleted(slug, steps.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- steps.length is stable per session slug.
  }, [slug])

  // A login mid-session applies server progress and fires this event so the
  // tracker re-reads localStorage instead of staying stuck on stale state.
  useEffect(() => {
    window.addEventListener('nm-progress-applied', rehydrate)
    window.addEventListener('nm-session-steps-changed', rehydrate)
    return () => {
      window.removeEventListener('nm-progress-applied', rehydrate)
      window.removeEventListener('nm-session-steps-changed', rehydrate)
    }
  }, [rehydrate])

  function toggle(index: number) {
    setCompleted((prev) => {
      const next = prev.slice()
      next[index] = !next[index]
      saveItem(storageKey(slug), JSON.stringify(next))
      window.dispatchEvent(new Event('nm-session-steps-changed'))
      return next
    })
  }

  const doneCount = completed.filter(Boolean).length
  const remaining = steps.length - doneCount
  const complete = mounted && steps.length > 0 && remaining === 0
  // Goal gradient: once past halfway, reframe around the shrinking finish line.
  const pastHalfway = mounted && doneCount > 0 && doneCount >= steps.length / 2

  // Real work done → offer (via the global overlay) to keep it.
  useEffect(() => {
    if (mounted && doneCount >= 2) earnSaveNudge()
  }, [mounted, doneCount])

  return (
    <div className="ssn-protocol" data-testid="step-tracker">
      <p className="ssn-protocol-progress" aria-live="polite">
        {!mounted && `${steps.length} steps`}
        {mounted && complete && 'All steps done'}
        {mounted && !complete && pastHalfway && (
          <>
            {doneCount} / {steps.length} —{' '}
            <strong className="ssn-protocol-almost">
              only {remaining} {remaining === 1 ? 'step' : 'steps'} left
            </strong>
          </>
        )}
        {mounted && !complete && !pastHalfway && `${doneCount} / ${steps.length} steps done`}
      </p>
      {mounted && doneCount > 0 && !complete && (
        <div className="ssn-protocol-bar" aria-hidden="true">
          <span
            className="ssn-protocol-bar-fill"
            style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }}
          />
        </div>
      )}
      {complete && (
        <div className="ssn-complete" data-testid="protocol-complete" role="status">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="ssn-complete-icon"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.5 2.5 2.5 5-5.5" />
          </svg>
          <span>
            <strong>Protocol complete.</strong> You ran the whole thing — most people never finish
            week one.
          </span>
        </div>
      )}
      <ol className="ssn-protocol-list">
        {steps.map((step, index) => {
          const inputId = `${slug}-step-${index}`
          return (
            <li
              key={step.title}
              id={stepAnchorId(slug, index)}
              className={`ssn-step${completed[index] ? ' ssn-step-done' : ''}`}
            >
              <div className="ssn-step-head">
                <span className="ssn-step-number tabular-nums" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="ssn-step-title">{step.title}</h3>
                <CredibilityBadge label={step.label} />
              </div>
              <p className="ssn-step-detail">{step.detail}</p>
              {step.example && <StepExample example={step.example} />}
              <label className="ssn-step-checkpoint" htmlFor={inputId}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={completed[index] ?? false}
                  onChange={() => toggle(index)}
                />
                <span className="ssn-check-mark" aria-hidden="true">
                  ✓
                </span>
                <span>Done when: {step.checkpoint}</span>
              </label>
              {step.reference && (
                <a
                  href={step.reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ssn-step-reference"
                >
                  {step.reference.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
      <style>{`
        .ssn-protocol {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ssn-protocol-progress {
          margin: 0;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.45);
        }
        .ssn-protocol-almost {
          color: #22d3ee;
        }
        .ssn-protocol-bar {
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .ssn-protocol-bar-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, hsla(var(--cat, 262), 85%, 65%, 1), #22d3ee);
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ssn-complete {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(251, 191, 36, 0.4);
          background: linear-gradient(120deg, rgba(251, 191, 36, 0.12), rgba(139, 92, 246, 0.1));
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ssn-complete-icon {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          color: #fbbf24;
        }
        .ssn-protocol-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .ssn-step {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          padding: 1.2rem 1.3rem;
          border-radius: 1rem;
          background: rgba(148, 112, 255, 0.05);
          border: 1px solid rgba(178, 148, 255, 0.14);
          backdrop-filter: blur(20px);
          transition: border-color 0.25s ease, background 0.25s ease;
          scroll-margin-top: 5.5rem;
        }
        .ssn-step-done {
          border-color: rgba(34, 211, 238, 0.4);
          background: rgba(34, 211, 238, 0.07);
        }
        .ssn-step-head {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          flex-wrap: wrap;
        }
        .ssn-step-number {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 600;
        }
        .ssn-step-title {
          margin: 0;
          font-size: 1rem;
          color: #fff;
          font-weight: 600;
          flex: 1 1 auto;
          min-width: 8rem;
        }
        .ssn-badge {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .ssn-badge-tested {
          color: #c4b5fd;
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .ssn-badge-research {
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.13);
          border-color: rgba(34, 211, 238, 0.4);
        }
        .ssn-badge-standard {
          color: #fcd34d;
          background: rgba(245, 158, 11, 0.13);
          border-color: rgba(245, 158, 11, 0.4);
        }
        .ssn-step-detail {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.68);
        }
        .ssn-step-checkpoint {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.78);
          cursor: pointer;
        }
        .ssn-step-checkpoint input {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
        }
        .ssn-check-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.15rem;
          height: 1.15rem;
          flex-shrink: 0;
          border-radius: 9999px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          font-size: 0.65rem;
          color: transparent;
          transition: all 0.2s ease;
        }
        .ssn-step-checkpoint input:checked + .ssn-check-mark {
          color: #0d0a1f;
          background: #22d3ee;
          border-color: #22d3ee;
        }
        .ssn-step-checkpoint input:focus-visible + .ssn-check-mark {
          outline: 2px solid rgba(34, 211, 238, 0.6);
          outline-offset: 2px;
        }
        .ssn-step-reference {
          align-self: flex-start;
          font-size: 0.75rem;
          color: #67e8f9;
          text-decoration: underline;
          text-underline-offset: 2px;
          word-break: break-word;
        }
        .ssn-step-reference:hover {
          color: #a5f3fc;
        }
        @media (max-width: 640px) {
          .ssn-step {
            padding: 1rem;
          }
          .ssn-step-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.4rem;
          }
          .ssn-step-title {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  )
}
