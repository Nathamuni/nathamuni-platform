import Link from 'next/link'
import { getAllStories, type Story } from '@/lib/stories'
import { ThumbPeek } from '@/components/fx/ThumbPeek'

function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function CardList({ stories, hidden }: { stories: Story[]; hidden?: boolean }) {
  return (
    <>
      {stories.map((story) => (
        <Link
          key={(hidden ? 'dup-' : '') + story.id}
          href="/moments"
          className="moment-strip-card"
          aria-hidden={hidden || undefined}
          tabIndex={hidden ? -1 : undefined}
        >
          {story.poster ? (
            <ThumbPeek src={story.poster} hue={340} className="thumb-peek-region">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.poster} alt="" loading="lazy" />
            </ThumbPeek>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600/40 to-pink-500/30 flex items-center justify-center">
              <span aria-hidden className="text-lg text-white/70">
                ▶
              </span>
            </div>
          )}
          <span className="moment-strip-date">{shortDate(story.date)}</span>
        </Link>
      ))}
      <Link
        href="/moments"
        className="moment-strip-card moment-strip-more"
        aria-hidden={hidden || undefined}
        tabIndex={hidden ? -1 : undefined}
      >
        <span>
          All
          <br />→
        </span>
      </Link>
    </>
  )
}

/**
 * Auto-flowing marquee of archived stories: the track drifts continuously
 * right-to-left (duplicated list = seamless loop), pauses while hovered or
 * pressed, and falls back to a plain swipeable strip for reduced-motion.
 */
export function MomentsStrip() {
  const recent = getAllStories().slice(0, 12)
  if (recent.length === 0) return null
  return (
    <section className="section" aria-labelledby="moments-heading" data-reveal>
      <h2 id="moments-heading" className="section-title">
        Moments
      </h2>
      <p className="section-sub">Stories Instagram deleted after 24h — archived here forever.</p>
      <div className="moments-marquee" data-testid="moments-strip">
        <div className="moments-track">
          <CardList stories={recent} />
          <CardList stories={recent} hidden />
        </div>
      </div>
    </section>
  )
}
