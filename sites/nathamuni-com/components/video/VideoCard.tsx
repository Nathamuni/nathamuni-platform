import Link from 'next/link'
import type { Video } from '@/lib/videos'
import { PlaceholderArt } from './PlaceholderArt'

export function VideoCard({ video }: { video: Video }) {
  return (
    <article className="video-card" data-testid="video-card">
      <Link href={`/videos/${video.id}`} className="video-card-media">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className="video-card-thumbnail" />
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
          {video.tags.map((tag) => (
            <li key={tag} className="video-card-tag">
              #{tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
