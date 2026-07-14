import type { TimelinePhase } from '@/lib/sessions'

/**
 * The "when" view of a session: phases laid out as connected segments
 * along a hued gradient rail — horizontal on desktop, stacked vertical on
 * mobile. Each segment carries its span (small caps), phase name, one-line
 * focus, and the step numbers it covers as small numbered dots. Pure
 * CSS — no scroll listeners, so it's reduced-motion safe by construction.
 */
export function SessionTimeline({
  hue,
  timeline,
}: {
  hue: number
  timeline: TimelinePhase[]
}) {
  return (
    <div className="ssn-timeline" style={{ '--cat': hue } as React.CSSProperties} data-testid="session-timeline">
      <p className="ssn-timeline-heading">The timeline</p>
      <ol className="ssn-timeline-rail">
        {timeline.map((block, index) => (
          <li
            key={block.phase}
            className="ssn-timeline-phase"
            style={{ borderColor: `hsla(${hue}, 80%, ${58 + index * 6}%, 0.9)` }}
          >
            <span
              className="ssn-timeline-dot"
              aria-hidden="true"
              style={{ background: `hsl(${hue} 85% ${64 + index * 6}%)` }}
            />
            <span className="ssn-timeline-span tabular-nums">{block.span}</span>
            <span className="ssn-timeline-name">{block.phase}</span>
            <p className="ssn-timeline-focus">{block.focus}</p>
            <span
              className="ssn-timeline-steps"
              aria-label={`Steps ${block.stepIndexes.map((i) => i + 1).join(', ')}`}
            >
              {block.stepIndexes.map((i) => (
                <span key={i} className="ssn-timeline-step-dot tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>

      <style>{`
        .ssn-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .ssn-timeline-heading {
          margin: 0;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.4);
        }
        .ssn-timeline-rail {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .ssn-timeline-phase {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 0.9rem 0 0.9rem 1rem;
          border-left: 3px solid;
        }
        .ssn-timeline-dot {
          position: absolute;
          top: -2px;
          left: -6px;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          box-shadow: 0 0 0 3px rgba(13, 10, 31, 0.9);
        }
        .ssn-timeline-span {
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.45);
        }
        .ssn-timeline-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
        }
        .ssn-timeline-focus {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.6);
          max-width: 32rem;
        }
        .ssn-timeline-steps {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-top: 0.15rem;
        }
        .ssn-timeline-step-dot {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 9999px;
          font-size: 0.62rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          background: hsla(var(--cat), 70%, 55%, 0.16);
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.4);
        }

        @media (min-width: 768px) {
          .ssn-timeline-rail {
            flex-direction: row;
            align-items: stretch;
            gap: 0;
          }
          .ssn-timeline-phase {
            flex: 1 1 0;
            min-width: 0;
            border-left: none;
            border-top: 3px solid;
            padding: 1rem 1rem 0 0;
          }
          .ssn-timeline-dot {
            top: -6px;
            left: -2px;
          }
          .ssn-timeline-focus {
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}
