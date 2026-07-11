/**
 * Vibrant gradient glass card that fills a `.moment-card` grid slot with a
 * short quote instead of a story clip — server-rendered, no interactivity,
 * so it never participates in the lightbox index math.
 */
export interface ThoughtCardProps {
  quote: string
  hue: number
  mark?: string
  isEndCap?: boolean
}

export function ThoughtCard({ quote, hue, mark = '⟡', isEndCap = false }: ThoughtCardProps) {
  return (
    <div
      className={`thought-card${isEndCap ? ' thought-card-endcap' : ''}`}
      style={{ '--cat': hue } as React.CSSProperties}
      data-testid={isEndCap ? 'thought-card-endcap' : 'thought-card'}
    >
      <p className="thought-card-quote">&ldquo;{quote}&rdquo;</p>
      <span className="thought-card-mark" aria-hidden>
        {mark}
      </span>
    </div>
  )
}
