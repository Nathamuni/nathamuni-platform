import Link from 'next/link'

/**
 * Shared rich page header for interior pages.
 *
 * Replaces the plain `section-title` + `section-sub` pair so the library and
 * content pages carry the same weight as /pulse and /stats: a display-scale
 * title, a lede, and an optional quiet line of real-data stats. No kicker label
 * above the title — the heading carries its own weight.
 *
 * Every value passed in must be real (counts from the actual library) — this
 * component never invents numbers.
 */

export interface HeaderStat {
  value: string | number
  label: string
  /** Optional link so a stat doubles as navigation (e.g. "165 videos" → /videos). */
  href?: string
}

export function PageHeader({
  title,
  lede,
  stats = [],
  accentHue = 262,
  children,
}: {
  title: string
  lede?: string
  stats?: HeaderStat[]
  /** Drives the accent glow — match the page's category colour where one exists. */
  accentHue?: number
  children?: React.ReactNode
}) {
  return (
    <header className="pg-head" style={{ '--pg-hue': accentHue } as React.CSSProperties} data-reveal>
      <h1 className="pg-head-title">{title}</h1>
      {lede && <p className="pg-head-lede">{lede}</p>}

      {stats.length > 0 && (
        <div className="pg-head-stats">
          {stats.map((s) => {
            const body = (
              <>
                <span className="pg-head-stat-value">
                  {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                </span>
                <span className="pg-head-stat-label">{s.label}</span>
              </>
            )
            return s.href ? (
              <Link key={s.label} href={s.href} className="pg-head-stat is-link">
                {body}
              </Link>
            ) : (
              <div key={s.label} className="pg-head-stat">
                {body}
              </div>
            )
          })}
        </div>
      )}

      {children}
    </header>
  )
}
