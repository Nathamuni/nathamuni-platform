'use client'

import { useState } from 'react'
import { Thumbnail } from '@/components/ui/Thumbnail'

/**
 * Click-to-load YouTube player.
 *
 * 21 reels are already public on YouTube, but every video page sent visitors off to
 * Instagram to watch — the one thing they came to do could not be done here.
 *
 * Deliberately a facade, not a bare <iframe>: embedding YouTube directly pulls roughly
 * three quarters of a megabyte of player JS and sets cookies on every page view, whether
 * or not anyone presses play. That would have undone the image work and made the
 * footer's tracking claim false again. Nothing loads until the visitor asks.
 *
 * Sizing is owned by the parent (.video-detail-media, aspect-ratio 9/14). This component
 * fills it rather than declaring its own ratio — two competing aspect-ratios on nested
 * boxes clipped the player. The <style> is rendered in both states for the same class of
 * reason: keeping it inside the facade branch unmounted it the moment playback started,
 * leaving the iframe unsized.
 */
export function YouTubePlayer({
  youtubeId,
  title,
  poster,
}: {
  youtubeId: string
  title: string
  poster: string | null
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <>
      {playing ? (
        <iframe
          className="yt-fill"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className="yt-facade yt-fill"
          onClick={() => setPlaying(true)}
          aria-label={`Play “${title}” on YouTube`}
          data-testid="youtube-facade"
        >
          {poster ? (
            <Thumbnail
              src={poster}
              alt=""
              loading="eager"
              fetchPriority="high"
              className="yt-poster"
            />
          ) : (
            <span className="yt-poster yt-poster-fallback" />
          )}
          <span className="yt-play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="60" height="42">
              <path
                d="M66.5 7.7a8 8 0 0 0-5.6-5.7C56 .7 34 .7 34 .7s-22 0-26.9 1.3A8 8 0 0 0 1.5 7.7 83 83 0 0 0 .2 24a83 83 0 0 0 1.3 16.3 8 8 0 0 0 5.6 5.7C12 47.3 34 47.3 34 47.3s22 0 26.9-1.3a8 8 0 0 0 5.6-5.7A83 83 0 0 0 67.8 24a83 83 0 0 0-1.3-16.3z"
                fill="#f00"
              />
              <path d="M27 34.3 45.8 24 27 13.7z" fill="#fff" />
            </svg>
          </span>
        </button>
      )}
      <style>{`
        .yt-fill {
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
          padding: 0;
          background: none;
        }
        .yt-facade {
          position: relative;
          cursor: pointer;
          line-height: 0;
        }
        .yt-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yt-poster-fallback {
          background: linear-gradient(
            135deg,
            rgb(var(--accent-rgb) / 0.4),
            rgb(var(--pink-rgb) / 0.3)
          );
        }
        .yt-play {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, opacity 0.2s ease;
          opacity: 0.92;
          filter: drop-shadow(0 4px 14px rgb(0 0 0 / 0.45));
        }
        .yt-facade:hover .yt-play {
          transform: scale(1.08);
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .yt-play,
          .yt-facade:hover .yt-play {
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </>
  )
}
