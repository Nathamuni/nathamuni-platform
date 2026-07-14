import type { CredibilityLabel } from '@/lib/sessions'

const BADGE_TEXT: Record<CredibilityLabel, string> = {
  tested: '☬ Tested on myself',
  research: 'Research-backed',
  standard: 'Standard practice',
}

const BADGE_CLASS: Record<CredibilityLabel, string> = {
  tested: 'ssn-badge-tested',
  research: 'ssn-badge-research',
  standard: 'ssn-badge-standard',
}

/**
 * Sitewide credibility labels, reused for sessions: 'tested' (violet — only
 * content he's personally run), 'research' (cyan — must carry a live
 * reference), 'standard' (amber — established guidance, confirm with a
 * professional). Styles are defined once in StepTracker's <style> block.
 */
export function CredibilityBadge({ label }: { label: CredibilityLabel }) {
  return <span className={`ssn-badge ${BADGE_CLASS[label]}`}>{BADGE_TEXT[label]}</span>
}
