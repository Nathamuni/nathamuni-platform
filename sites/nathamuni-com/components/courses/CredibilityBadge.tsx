import type { CredibilityLabel } from '@/lib/courses'

const BADGE_TEXT: Record<CredibilityLabel, string> = {
  tested: '☬ Tested on myself',
  research: 'Research-backed',
  standard: 'Standard practice',
}

const BADGE_LETTER: Record<CredibilityLabel, string> = {
  tested: 'T',
  research: 'R',
  standard: 'S',
}

/**
 * Small colored chip declaring where a block's claim comes from. See
 * lib/courses.ts for the credibility model.
 *
 * `compact` renders a tiny lettered dot instead of the full pill — used in a
 * module's collapsed summary row to show which kinds of claims it contains
 * without repeating the full badge text three times.
 */
export function CredibilityBadge({
  label,
  compact = false,
}: {
  label: CredibilityLabel
  compact?: boolean
}) {
  if (compact) {
    return (
      <span
        className={`crs-badge-dot crs-badge-dot-${label}`}
        data-testid="credibility-badge-dot"
        data-label={label}
        title={BADGE_TEXT[label]}
      >
        {BADGE_LETTER[label]}
        <span className="sr-only"> {BADGE_TEXT[label]}</span>
      </span>
    )
  }

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
