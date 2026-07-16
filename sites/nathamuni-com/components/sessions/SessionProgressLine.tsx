'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadItem } from '@/lib/progress'

function countDone(slug: string, totalSteps: number): number {
  try {
    const raw = loadItem(`session-${slug}`)
    if (!raw) return 0
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return 0
    let done = 0
    for (let i = 0; i < totalSteps; i++) if (parsed[i]) done++
    return done
  } catch {
    return 0
  }
}

/**
 * "My progress" line on a session index card — slim animated bar + steps
 * count, shown only once the visitor has actually started the protocol.
 */
export function SessionProgressLine({ slug, totalSteps }: { slug: string; totalSteps: number }) {
  const [done, setDone] = useState(0)

  const refresh = useCallback(() => setDone(countDone(slug, totalSteps)), [slug, totalSteps])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    refresh()
    window.addEventListener('nm-progress-applied', refresh)
    return () => window.removeEventListener('nm-progress-applied', refresh)
  }, [refresh])

  if (done === 0) return null
  const pct = totalSteps > 0 ? Math.round((done / totalSteps) * 100) : 0

  return (
    <span className="ssn-card-progress" data-testid="session-progress-line">
      <span className="ssn-card-progress-bar" aria-hidden="true">
        <span className="ssn-card-progress-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="ssn-card-progress-pct tabular-nums">
        {pct === 100 ? 'Done ✓' : `${done}/${totalSteps} steps — continue`}
      </span>

      <style>{`
        .ssn-card-progress {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-top: 0.2rem;
        }
        .ssn-card-progress-bar {
          display: block;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .ssn-card-progress-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, hsla(var(--cat, 262), 85%, 65%, 1), #22d3ee);
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ssn-card-progress-pct {
          font-size: 0.7rem;
          font-weight: 600;
          color: hsla(var(--cat, 262), 90%, 78%, 1);
        }
      `}</style>
    </span>
  )
}
