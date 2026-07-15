/**
 * Every session page must render this prominently. Not decorative — this is
 * the line that keeps "tested on myself" from being read as medical advice.
 */
export function DisclaimerCard() {
  return (
    <aside className="glass-card ssn-disclaimer" role="note" data-testid="session-disclaimer">
      <span className="ssn-disclaimer-mark" aria-hidden="true">
        !
      </span>
      <p>
        This is my tested process, not medical advice. I&apos;m an engineer, not a doctor. Confirm
        health decisions (especially blood work, diet changes, training with injuries) with a
        professional.
      </p>
      <style>{`
        .ssn-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1.1rem 1.3rem;
          border-color: rgba(245, 158, 11, 0.35);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(13, 10, 31, 0.6) 70%);
        }
        .ssn-disclaimer-mark {
          flex-shrink: 0;
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: #0d0a1f;
          background: #f59e0b;
        }
        .ssn-disclaimer p {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }
        @media (max-width: 640px) {
          .ssn-disclaimer {
            padding: 0.9rem 1rem;
          }
        }
      `}</style>
    </aside>
  )
}
