import type { Metadata } from 'next'
import { getPrinciples, getDecisions, getGoals } from '@/lib/journey'
import { PrinciplesGrid } from '@/components/journey/PrinciplesGrid'
import { DecisionMap } from '@/components/journey/DecisionMap'
import { GoalsTracker } from '@/components/journey/GoalsTracker'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Journey',
  description:
    'The principles I run on, the decisions that built them, and an honest tally of what is done, in progress, and still a dream.',
  alternates: { canonical: '/journey' },
}

const labelClass = 'text-[0.65rem] uppercase tracking-widest text-white/40'

export default function JourneyPage() {
  const principles = getPrinciples()
  const decisions = getDecisions()
  const goals = getGoals()

  return (
    <>
      <section className="section" data-testid="journey-page">
        <div className="mb-10 sm:mb-14 max-w-2xl" data-reveal>
          <PageHeader
            eyebrow="Not a highlight reel"
            title="The rules, and what they cost."
            lede="The principles I run on, the decisions that shaped them, and an honest tally of what's done, in progress, and still just a dream."
            accentHue={38}
            stats={[
              { value: principles.length, label: 'Principles' },
              { value: decisions.length, label: 'Decisions' },
              { value: goals.length, label: 'Goals' },
            ]}
          />
        </div>

        <div>
          <h2 className={`${labelClass} mb-5 sm:mb-6`} data-reveal>
            The operating system
          </h2>
          <PrinciplesGrid principles={principles} />
        </div>
      </section>

      <section className="section">
        <h2 className={`${labelClass} mb-8 sm:mb-10`} data-reveal>
          The decision map
        </h2>
        <DecisionMap nodes={decisions} />
      </section>

      <section className="section">
        <h2 className={`${labelClass} mb-6 sm:mb-8`} data-reveal>
          Dreams &amp; milestones
        </h2>
        <GoalsTracker goals={goals} />
      </section>
    </>
  )
}
