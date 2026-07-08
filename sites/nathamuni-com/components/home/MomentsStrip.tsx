import Link from 'next/link'
import { getAllStories } from '@/lib/stories'

function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Flowing card strip of archived stories (snap-scroll, square-ish cards) —
 * replaces the earlier circle ring per owner feedback.
 */
export function MomentsStrip() {
  const recent = getAllStories().slice(0, 10)
  if (recent.length === 0) return null
  return (
    <section className="section" aria-labelledby="moments-heading" data-reveal>
      <div className="section-head-row">
        <div>
          <h2 id="moments-heading" className="section-title">
            Moments
          </h2>
          <p className="section-sub">Stories Instagram deleted after 24h — archived here forever.</p>
        </div>
      </div>
      <div className="moments-strip" data-testid="moments-strip">
        {recent.map((story) => (
          <Link key={story.id} href="/moments" className="moment-strip-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.poster} alt="" loading="lazy" />
            <span className="moment-strip-date">{shortDate(story.date)}</span>
          </Link>
        ))}
        <Link href="/moments" className="moment-strip-card moment-strip-more">
          <span>
            All
            <br />→
          </span>
        </Link>
      </div>
    </section>
  )
}
