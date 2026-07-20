import type { Metadata } from 'next'
import { getAllVideos, getAllCategories } from '@/lib/videos'
import { VideoExplorer } from '@/components/video/VideoExplorer'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Video Library',
  description:
    "Search all of Nathamuni's videos by topic, category, or tag — discipline, calisthenics, AI builds, and more.",
  alternates: { canonical: '/videos' },
}

export default function VideosPage() {
  const videos = getAllVideos()
  const categories = getAllCategories()
  const reels = videos.filter((v) => v.mediaType !== 'post').length

  return (
    <section className="section">
      <PageHeader
        eyebrow="The library"
        title="Everything, searchable."
        lede="No endless scrolling. Search the whole library by topic, tag, or pillar — every video tested on myself before it went up."
        accentHue={192}
        stats={[
          { value: videos.length, label: 'Videos' },
          { value: reels, label: 'Reels' },
          { value: categories.length, label: 'Pillars' },
        ]}
      />
      <VideoExplorer videos={videos} />
    </section>
  )
}
