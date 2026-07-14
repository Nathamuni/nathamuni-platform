import { stepAnchorId, type Step } from '@/lib/sessions'

const RING_CLASS: Record<Step['label'], string> = {
  tested: 'ssn-flow-ring-tested',
  research: 'ssn-flow-ring-research',
  standard: 'ssn-flow-ring-standard',
}

/**
 * The flow map — a compact vertical diagram at the top of each session
 * page: numbered nodes (one line per step title) connected by a gradient
 * spine, ending in a 'Done' terminal node showing the session's promise.
 * Mirrors the visual language of journey/DecisionMap (violet → magenta →
 * cyan spine) but stays static and compact — this is a map, not the
 * page's centerpiece. Clicking a node scrolls to that step's card in
 * StepTracker via a shared anchor id (see lib/sessions#stepAnchorId).
 */
export function SessionFlow({
  slug,
  steps,
  promise,
}: {
  slug: string
  steps: Step[]
  promise: string
}) {
  return (
    <nav className="ssn-flow" aria-label="Session flow" data-testid="session-flow">
      <p className="ssn-flow-heading">The flow</p>
      <div className="ssn-flow-diagram">
        <span className="ssn-flow-spine" aria-hidden="true" />
        <ol className="ssn-flow-list">
          {steps.map((step, index) => (
            <li key={step.title} className="ssn-flow-item">
              <a href={`#${stepAnchorId(slug, index)}`} className="ssn-flow-node">
                <span className={`ssn-flow-ring ${RING_CLASS[step.label]}`} aria-hidden="true">
                  {index + 1}
                </span>
                <span className="ssn-flow-title">{step.title}</span>
              </a>
            </li>
          ))}
          <li className="ssn-flow-item ssn-flow-item-terminal">
            <span className="ssn-flow-node ssn-flow-node-terminal">
              <span className="ssn-flow-ring ssn-flow-ring-done" aria-hidden="true">
                ✓
              </span>
              <span className="ssn-flow-title ssn-flow-title-terminal">{promise}</span>
            </span>
          </li>
        </ol>
      </div>

      <style>{`
        .ssn-flow {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .ssn-flow-heading {
          margin: 0;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.4);
        }
        .ssn-flow-diagram {
          position: relative;
          padding-left: 0.1rem;
        }
        .ssn-flow-spine {
          position: absolute;
          top: 0.9rem;
          bottom: 1.6rem;
          left: 1.05rem;
          width: 3px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #8b5cf6, #ec4899 55%, #22d3ee);
        }
        .ssn-flow-spine::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -6px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #22d3ee;
        }
        .ssn-flow-list {
          position: relative;
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .ssn-flow-item {
          position: relative;
        }
        .ssn-flow-node {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.5rem 0.6rem;
          border-radius: 0.7rem;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        a.ssn-flow-node:hover,
        a.ssn-flow-node:focus-visible {
          background: rgba(255, 255, 255, 0.06);
        }
        a.ssn-flow-node:focus-visible {
          outline: 2px solid rgba(34, 211, 238, 0.6);
          outline-offset: 2px;
        }
        .ssn-flow-ring {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.15rem;
          height: 2.15rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          background: rgba(13, 10, 31, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.2);
          z-index: 1;
        }
        .ssn-flow-ring-tested {
          color: #c4b5fd;
          border-color: #8b5cf6;
        }
        .ssn-flow-ring-research {
          color: #67e8f9;
          border-color: #22d3ee;
        }
        .ssn-flow-ring-standard {
          color: #fcd34d;
          border-color: #f59e0b;
        }
        .ssn-flow-ring-done {
          color: #0d0a1f;
          background: #22d3ee;
          border-color: #22d3ee;
        }
        .ssn-flow-title {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ssn-flow-title-terminal {
          white-space: normal;
          font-weight: 600;
          color: #fff;
        }
        @media (max-width: 640px) {
          .ssn-flow-spine {
            left: 0.85rem;
          }
          .ssn-flow-ring {
            width: 1.85rem;
            height: 1.85rem;
            font-size: 0.72rem;
          }
          .ssn-flow-title {
            white-space: normal;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </nav>
  )
}
