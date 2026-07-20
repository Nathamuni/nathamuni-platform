import type { Metadata } from 'next'
import { getAllSessions } from '@/lib/sessions'
import { SessionCard } from '@/components/sessions/SessionCard'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Sessions',
  description:
    'Bounded, guided protocols — explicit steps, metrics to track, checkpoints, a start and an end. Pick one, run it.',
  alternates: { canonical: '/sessions' },
}

export default function SessionsPage() {
  const sessions = getAllSessions()
  const totalSteps = sessions.reduce((sum, s) => sum + s.steps.length, 0)
  return (
    <section className="section">
      <PageHeader
        eyebrow="Run, don't read"
        title="Protocols you actually execute."
        lede="A session isn't an article. Pick one, enter focus mode, follow the steps, track the numbers — it holds your place until it's done."
        accentHue={152}
        stats={[
          { value: sessions.length, label: 'Sessions' },
          { value: totalSteps, label: 'Steps' },
        ]}
      />
      <div className="ssn-index-grid">
        {sessions.map((session) => (
          <SessionCard key={session.slug} session={session} />
        ))}
      </div>
      <style>{`
        .ssn-index-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
          gap: 1.1rem;
          margin-top: 0.5rem;
        }
        .ssn-card {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.4rem 1.5rem;
          height: 100%;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          border-color: hsla(var(--cat), 70%, 60%, 0.22);
        }
        .ssn-card:hover {
          border-color: hsla(var(--cat), 85%, 70%, 0.75);
          box-shadow: 0 16px 48px -14px hsla(var(--cat), 85%, 55%, 0.5);
        }
        .ssn-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .ssn-card-duration {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          color: hsla(var(--cat), 85%, 75%, 1);
          background: hsla(var(--cat), 80%, 55%, 0.12);
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.35);
        }
        .ssn-card-chips {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ssn-card-phase-count,
        .ssn-card-metric-count {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
        }
        .ssn-card-phase-count {
          padding-right: 0.5rem;
          border-right: 1px solid rgba(255, 255, 255, 0.14);
        }
        .ssn-card-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .ssn-card-promise {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.72);
        }
        .ssn-card-forwhom {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.45);
        }
        .ssn-card-cta {
          margin-top: auto;
          padding-top: 0.4rem;
          font-size: 0.8rem;
          color: hsla(var(--cat), 90%, 78%, 1);
          font-weight: 600;
        }
      `}</style>
    </section>
  )
}
