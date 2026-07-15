import type { StepExample as StepExampleData } from '@/lib/sessions'

/**
 * Compact good/bad contrast card pair for a protocol step. Purely
 * presentational — no state, no interactivity. Rendered by StepTracker
 * directly under a step's detail text when the step has an `example`.
 */
export function StepExample({ example }: { example: StepExampleData }) {
  return (
    <div className="ssn-example" role="group" aria-label="Do this, not this example">
      <div className="ssn-example-card ssn-example-good">
        <span className="ssn-example-glyph" aria-hidden="true">
          ✓
        </span>
        <div className="ssn-example-body">
          <p className="ssn-example-label">Do this</p>
          <p className="ssn-example-text">{example.good}</p>
        </div>
      </div>
      <div className="ssn-example-card ssn-example-bad">
        <span className="ssn-example-glyph" aria-hidden="true">
          ✕
        </span>
        <div className="ssn-example-body">
          <p className="ssn-example-label">Not this</p>
          <p className="ssn-example-text">{example.bad}</p>
        </div>
      </div>

      <style>{`
        .ssn-example {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .ssn-example-card {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          min-height: 44px;
          padding: 0.7rem 0.8rem;
          border-radius: 0.75rem;
          border: 1px solid transparent;
        }
        .ssn-example-good {
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.28);
        }
        .ssn-example-bad {
          background: rgba(244, 63, 94, 0.08);
          border-color: rgba(244, 63, 94, 0.28);
        }
        .ssn-example-glyph {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.3rem;
          height: 1.3rem;
          margin-top: 0.05rem;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .ssn-example-good .ssn-example-glyph {
          color: #4ade80;
          background: rgba(34, 197, 94, 0.18);
        }
        .ssn-example-bad .ssn-example-glyph {
          color: #fb7185;
          background: rgba(244, 63, 94, 0.18);
        }
        .ssn-example-body {
          min-width: 0;
        }
        .ssn-example-label {
          margin: 0 0 0.15rem;
          font-size: 0.63rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 700;
        }
        .ssn-example-good .ssn-example-label {
          color: #86efac;
        }
        .ssn-example-bad .ssn-example-label {
          color: #fda4af;
        }
        .ssn-example-text {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.78);
        }
        @media (max-width: 640px) {
          .ssn-example {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ssn-example-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}
