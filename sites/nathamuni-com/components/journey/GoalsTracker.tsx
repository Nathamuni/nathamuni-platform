import type { Goal, GoalState } from '@/lib/journey'

const GROUPS: { state: GoalState; heading: string }[] = [
  { state: 'achieved', heading: 'Achieved' },
  { state: 'in-progress', heading: 'In progress' },
  { state: 'dream', heading: 'Dreams' },
]

const MARKER_CLASS: Record<GoalState, string> = {
  achieved: 'jny-marker-achieved',
  'in-progress': 'jny-marker-progress',
  dream: 'jny-marker-dream',
}

const tabularNums: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

/**
 * Act III — "Dreams & milestones". A quiet, scannable tracker grouped by
 * state: filled marker for what's done, a slow-spinning gradient marker for
 * what's underway, and a hollow glowing marker for what's still a dream.
 */
export function GoalsTracker({ goals }: { goals: Goal[] }) {
  return (
    <div className="flex flex-col gap-8 sm:gap-10" data-testid="goals-tracker">
      {GROUPS.map((group) => {
        const items = goals.filter((g) => g.state === group.state)
        if (items.length === 0) return null
        return (
          <div key={group.state} data-reveal>
            <h3 className="text-[0.65rem] uppercase tracking-widest text-white/40 mb-3 sm:mb-4">
              {group.heading}
            </h3>
            <ul className="flex flex-col gap-3">
              {items.map((goal) => (
                <li key={goal.id} className="glass-card p-4 sm:p-5 flex items-start gap-3">
                  <span
                    className={`jny-marker ${MARKER_CLASS[goal.state]}`}
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-display text-sm sm:text-base text-white">
                        {goal.title}
                      </span>
                      {goal.dateLabel && (
                        <span
                          className="text-[0.65rem] uppercase tracking-widest text-white/40"
                          style={tabularNums}
                        >
                          {goal.dateLabel}
                        </span>
                      )}
                    </div>
                    {goal.detail && (
                      <p className="text-sm text-white/60 leading-relaxed">{goal.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      <style>{`
        .jny-marker {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 9999px;
          margin-top: 0.3rem;
          flex-shrink: 0;
        }
        .jny-marker-achieved {
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
        }
        .jny-marker-progress {
          background: conic-gradient(from 0deg, #8b5cf6, #ec4899, #22d3ee, #8b5cf6);
          animation: jny-spin 3s linear infinite;
        }
        .jny-marker-dream {
          background: transparent;
          border: 1.5px solid rgba(236, 72, 153, 0.65);
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.45);
        }
        @keyframes jny-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jny-marker-progress { animation: none; }
        }
      `}</style>
    </div>
  )
}
