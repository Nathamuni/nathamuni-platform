import type { CredibilityLabel } from '@/lib/courses'

const BADGE_TEXT: Record<CredibilityLabel, string> = {
  tested: '☬ Tested on myself',
  research: 'Research-backed',
  standard: 'Standard practice',
}

/** Small colored chip declaring where a block's claim comes from. See lib/courses.ts for the credibility model. */
export function CredibilityBadge({ label }: { label: CredibilityLabel }) {
  return (
    <span
      className={`crs-badge crs-badge-${label}`}
      data-testid="credibility-badge"
      data-label={label}
    >
      {BADGE_TEXT[label]}
    </span>
  )
}
