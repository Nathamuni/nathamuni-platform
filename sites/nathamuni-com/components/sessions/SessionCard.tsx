import Link from 'next/link'
import type { Session } from '@/lib/sessions'
import { TiltCard } from '@/components/fx/TiltCard'

/** Index card — deliberately duration + "run this" forward, distinct from a course card. */
export function SessionCard({ session }: { session: Session }) {
  return (
    <TiltCard>
      <Link
        href={`/sessions/${session.slug}`}
        className="glass-card ssn-card"
        style={{ '--cat': session.hue } as React.CSSProperties}
        data-testid="session-card"
      >
        <div className="ssn-card-top">
          <span className="ssn-card-duration tabular-nums">{session.durationLabel}</span>
          <span className="ssn-card-chips">
            <span className="ssn-card-phase-count">{session.timeline.length} phases</span>
            <span className="ssn-card-metric-count">{session.metrics.length} metrics</span>
          </span>
        </div>
        <h2 className="ssn-card-title">{session.title}</h2>
        <p className="ssn-card-promise">{session.promise}</p>
        <p className="ssn-card-forwhom">{session.forWhom}</p>
        <span className="ssn-card-cta">Run this →</span>
      </Link>
    </TiltCard>
  )
}
