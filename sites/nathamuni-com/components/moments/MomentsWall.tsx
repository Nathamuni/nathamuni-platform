'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Story } from '@/lib/stories'
import { ThumbPeek } from '@/components/fx/ThumbPeek'

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const active = activeIndex !== null ? stories[activeIndex] : null

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i - 1 + stories.length) % stories.length))
  }, [stories.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i + 1) % stories.length))
  }, [stories.length])

  const close = useCallback(() => setActiveIndex(null), [])

  const handleEnded = useCallback(() => {
    setActiveIndex((i) => {
      if (i === null) return i
      if (i === stories.length - 1) return null
      return i + 1
    })
  }, [stories.length])

  useEffect(() => {
    if (activeIndex === null) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, goPrev, goNext, close])

  return (
    <>
      <div className="moments-grid" data-testid="moments-grid">
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            className="moment-card"
            onClick={() => setActiveIndex(index)}
            aria-label={`Play story from ${formatDate(story.date)}`}
          >
            <ThumbPeek src={story.poster} hue={340} className="thumb-peek-region">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.poster} alt="" loading="lazy" className="moment-poster" />
            </ThumbPeek>
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
          onClick={close}
        >
          <div className="moment-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <video
              key={active.id}
              src={active.video}
              poster={active.poster}
              controls
              autoPlay
              playsInline
              onEnded={handleEnded}
              className="moment-video"
            />
            {stories.length > 1 && (
              <>
                <button
                  type="button"
                  className="moment-nav moment-nav-prev"
                  onClick={goPrev}
                  aria-label="Previous moment"
                  data-testid="moment-nav-prev"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="moment-nav moment-nav-next"
                  onClick={goNext}
                  aria-label="Next moment"
                  data-testid="moment-nav-next"
                >
                  ›
                </button>
              </>
            )}
            <div className="moment-lightbox-meta">
              <span>{formatDate(active.date)}</span>
              <button type="button" className="moment-close" onClick={close}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
