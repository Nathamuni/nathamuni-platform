import type { Metadata } from 'next'
import { getAllStories } from '@/lib/stories'
import { MomentsWall } from '@/components/moments/MomentsWall'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Moments',
  description:
    "Nathamuni's story archive — the moments Instagram deletes after 24 hours, kept alive and watchable here.",
  alternates: { canonical: '/moments' },
}

export default function MomentsPage() {
  const stories = getAllStories()
  return (
    <section className="section">
      <PageHeader
        eyebrow="The 24-hour archive"
        title="Stories that didn't disappear."
        lede="Instagram deletes these after a day. Every one is captured and self-hosted here instead — the moments behind the content, kept."
        accentHue={340}
        stats={[{ value: stories.length, label: 'Moments' }]}
      />
      <MomentsWall stories={stories} />
    </section>
  )
}
