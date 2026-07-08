import type { Metadata } from 'next'
import { getAllStories } from '@/lib/stories'
import { MomentsWall } from '@/components/moments/MomentsWall'

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
      <h1 className="section-title">Moments</h1>
      <p className="section-sub">
        {stories.length} stories — Instagram deletes these after 24 hours. This archive
        doesn&apos;t.
      </p>
      <MomentsWall stories={stories} />
    </section>
  )
}
