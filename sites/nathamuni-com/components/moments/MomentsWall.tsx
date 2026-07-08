'use client'

import { useState } from 'react'
import type { Story } from '@/lib/stories'

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Grid of archived stories with a tap-to-play lightbox. These clips are
 * self-hosted (Instagram deletes stories after 24h, so there is nothing to
 * link out to) — posters load lazily, video only streams on tap.
 */
export function MomentsWall({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState<Story | null>(null)

  return (
    <>
      <div className="moments-grid" data-testid="moments-grid">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            className="moment-card"
            onClick={() => setActive(story)}
            aria-label={`Play story from ${formatDate(story.date)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.poster} alt="" loading="lazy" className="moment-poster" />
            <span className="moment-play" aria-hidden>
              ▶
            </span>
            <span className="moment-date">{formatDate(story.date)}</span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="moment-lightbox"
          data-testid="moment-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div className="moment-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <video
              key={active.id}
              src={active.video}
              poster={active.poster}
              controls
              autoPlay
              playsInline
              className="moment-video"
            />
            <div className="moment-lightbox-meta">
              <span>{formatDate(active.date)}</span>
              <button type="button" className="moment-close" onClick={() => setActive(null)}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
