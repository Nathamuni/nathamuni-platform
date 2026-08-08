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
      {/* Card titles are h3, so without this the page jumped h1 -> h3 (axe
          heading-order). Visually hidden: the header above already reads as the
          section's title, this only restores the level for screen readers. */}
      <h2 className="sr-only">Video library</h2>
      <VideoExplorer videos={videos} />
    </section>
  )
}
