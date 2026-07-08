import Link from 'next/link'
import type { Video } from '@/lib/videos'
import { getCategoryMeta } from '@/lib/categoryMeta'
import { PlaceholderArt } from './PlaceholderArt'
import { VideoCard } from './VideoCard'

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function VideoDetail({ video, related = [] }: { video: Video; related?: Video[] }) {
  const meta = getCategoryMeta(video.category)
  return (
    <>
      <article
        className="section video-detail anim-fade-up"
        data-testid="video-detail"
        style={{ '--cat': meta.hue } as React.CSSProperties}
      >
        <div className="video-detail-media">
          {video.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail} alt={video.title} className="video-detail-thumbnail" />
          ) : (
            <PlaceholderArt category={video.category} />
          )}
        </div>
        <div className="video-detail-body">
          <Link
            href={`/videos?category=${encodeURIComponent(video.category)}`}
            className="detail-category-chip"
            data-testid="detail-category-chip"
          >
            {meta.icon} {video.category}
          </Link>
          <h1 className="video-detail-title">{video.title}</h1>
          <span className="video-detail-date">{formatDate(video.publishedDate)}</span>
          <p className="video-detail-description">{video.detailedDescription}</p>
          <ul className="video-card-tags">
            {video.tags.map((tag) => (
              <li key={tag}>
                <Link href={`/videos?tag=${encodeURIComponent(tag)}`} className="detail-tag">
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
          {video.keyLessons && video.keyLessons.length > 0 && (
            <div className="video-detail-lessons" data-testid="video-detail-lessons">
              <h2>Key lessons</h2>
              <ul>
                {video.keyLessons.map((lesson) => (
                  <li key={lesson}>{lesson}</li>
                ))}
              </ul>
            </div>
          )}
          <a
            href={video.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="social-button social-button-primary detail-cta"
            data-testid="watch-on-instagram"
          >
            {(video.mediaType ?? 'reel') === 'post' ? '📷 View on Instagram' : '🎬 Watch on Instagram'}
          </a>
        </div>
      </article>
      {related.length > 0 && (
        <section className="section" data-testid="related-videos">
          <h2 className="section-title">More like this</h2>
          <p className="section-sub">From {video.category}</p>
          <div className="related-grid">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
