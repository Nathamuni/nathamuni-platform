import type { Principle } from '@/lib/journey'

/**
 * Act I — "The operating system". An elegant, staggered card constellation
 * of the rules everything else on this page follows from.
 */
export function PrinciplesGrid({ principles }: { principles: Principle[] }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
      data-reveal
      data-testid="principles-grid"
    >
      {principles.map((principle, i) => (
        <div
          key={principle.id}
          className={`glass-card p-5 sm:p-6 flex flex-col gap-2 anim-fade-up${
            i ? ` anim-delay-${Math.min(i, 4)}` : ''
          }`}
        >
          <h3 className="font-display text-base sm:text-lg text-white leading-snug">
            {principle.title}
          </h3>
          <p className="text-sm text-white/65 leading-relaxed">{principle.meaning}</p>
          {principle.origin && (
            <p className="text-xs text-white/40 italic mt-1">{principle.origin}</p>
          )}
        </div>
      ))}
    </div>
  )
}
