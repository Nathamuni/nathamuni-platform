import type { Video } from '@/lib/videos'
import { PlaceholderArt } from './PlaceholderArt'

export function VideoDetail({ video }: { video: Video }) {
  return (
    <article className="section video-detail" data-testid="video-detail">
      <div className="video-detail-media">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className="video-detail-thumbnail" />
        ) : (
          <PlaceholderArt category={video.category} />
        )}
      </div>
      <div className="video-detail-body">
        <span className="video-card-category">{video.category}</span>
        <h1 className="video-detail-title">{video.title}</h1>
        <p className="video-detail-description">{video.detailedDescription}</p>
        <ul className="video-card-tags">
          {video.tags.map((tag) => (
            <li key={tag} className="video-card-tag">
              #{tag}
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
          className="social-button social-button-primary"
          data-testid="watch-on-instagram"
        >
          Watch on Instagram
        </a>
      </div>
    </article>
  )
}
