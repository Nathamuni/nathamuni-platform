import type { Metadata } from 'next'
import { getAllVideos } from '@/lib/videos'
import { VideoExplorer } from '@/components/video/VideoExplorer'

export const metadata: Metadata = {
  title: 'Video Library',
  description:
    "Search all of Nathamuni's videos by topic, category, or tag — discipline, calisthenics, AI builds, and more.",
  alternates: { canonical: '/videos' },
}

export default function VideosPage() {
  const videos = getAllVideos()
  return (
    <section className="section">
      <h1 className="section-title">Video Library</h1>
      <p className="section-sub">{videos.length} videos — search anything, or filter by pillar.</p>
      <VideoExplorer videos={videos} />
    </section>
  )
}
