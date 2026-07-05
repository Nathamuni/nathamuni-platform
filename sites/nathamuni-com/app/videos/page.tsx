import { getAllVideos } from '@/lib/videos'
import { VideoExplorer } from '@/components/video/VideoExplorer'

export default function VideosPage() {
  const videos = getAllVideos()
  return (
    <section className="section">
      <h1 className="section-title">Video Library</h1>
      <VideoExplorer videos={videos} />
    </section>
  )
}
