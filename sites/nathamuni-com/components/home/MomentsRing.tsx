import Link from 'next/link'
import { getAllStories } from '@/lib/stories'

/** Instagram-highlights-style ring strip on the homepage, linking to /moments. */
export function MomentsRing() {
  const recent = getAllStories().slice(0, 8)
  if (recent.length === 0) return null
  return (
    <section className="section" aria-labelledby="moments-heading">
      <h2 id="moments-heading" className="section-title">
        Moments
      </h2>
      <p className="section-sub">Stories that Instagram forgot — this site doesn&apos;t.</p>
      <div className="moments-ring-row" data-testid="moments-ring">
        {recent.map((story) => (
          <Link key={story.id} href="/moments" className="moments-ring-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.poster} alt="" loading="lazy" />
          </Link>
        ))}
        <Link href="/moments" className="moments-ring-item moments-ring-more">
          <span>All →</span>
        </Link>
      </div>
    </section>
  )
}
