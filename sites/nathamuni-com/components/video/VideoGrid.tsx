import type { Video } from '@/lib/videos'
import { VideoCard } from './VideoCard'

export function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <p className="video-grid-empty" data-testid="video-grid-empty">
        No videos match your search yet — try a different keyword or category.
      </p>
    )
  }
  return (
    <div className="video-grid" data-testid="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
