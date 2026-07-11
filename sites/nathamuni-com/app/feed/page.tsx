import type { Metadata } from 'next'
import { getFeed } from '@/lib/feed'
import { FeedTimeline } from '@/components/feed/FeedTimeline'

export const metadata: Metadata = {
  title: 'Feed — everything as it happened',
  description:
    'Every reel, post, moment, and essay Nathamuni has published, in one reverse-chronological stream.',
  alternates: { canonical: '/feed' },
}

export default function FeedPage() {
  const entries = getFeed()
  return (
    <section className="section">
      <h1 className="section-title">The feed</h1>
      <p className="section-sub">
        Everything, as it happened — reels, posts, moments, and essays in one stream.
      </p>
      <FeedTimeline entries={entries} />
    </section>
  )
}
