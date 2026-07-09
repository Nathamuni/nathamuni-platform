import Link from 'next/link'
import type { Video } from '@/lib/videos'
import { getCategoryMeta } from '@/lib/categoryMeta'
import { TiltCard } from '@/components/fx/TiltCard'
import { ThumbPeek } from '@/components/fx/ThumbPeek'
import { PlaceholderArt } from './PlaceholderArt'

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VideoCard({ video }: { video: Video }) {
  const meta = getCategoryMeta(video.category)
  return (
    <TiltCard>
    <article
      className="video-card"
      data-testid="video-card"
      style={{ '--cat': meta.hue } as React.CSSProperties}
    >
      <Link href={`/videos/${video.id}`} className="video-card-media">
        {(video.mediaType ?? 'reel') === 'post' && (
          <span className="media-type-badge" aria-label="Photo post">📷</span>
        )}
        {video.thumbnail ? (
          <ThumbPeek src={video.thumbnail} hue={meta.hue} longPress className="thumb-peek-region">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail}
              alt={video.title}
              loading="lazy"
              className="video-card-thumbnail"
            />
          </ThumbPeek>
        ) : (
          <PlaceholderArt category={video.category} />
        )}
      </Link>
      <div className="video-card-body">
        <span className="video-card-category">{video.category}</span>
        <h3 className="video-card-title">
          <Link href={`/videos/${video.id}`}>{video.title}</Link>
        </h3>
        <p className="video-card-description">{video.shortDescription}</p>
        <ul className="video-card-tags">
          {video.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              <Link href={`/videos?tag=${encodeURIComponent(tag)}`} className="video-card-tag">
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
        <span className="video-card-date">{formatDate(video.publishedDate)}</span>
      </div>
    </article>
    </TiltCard>
  )
}
