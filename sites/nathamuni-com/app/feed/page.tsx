import type { Metadata } from 'next'
import { getFeed } from '@/lib/feed'
import { FeedTimeline } from '@/components/feed/FeedTimeline'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Feed — everything as it happened',
  description:
    'Every reel, post, moment, and essay Nathamuni has published, in one reverse-chronological stream.',
  alternates: { canonical: '/feed' },
}

export default function FeedPage() {
  const entries = getFeed()
  const latest = entries[0]?.date

  return (
    <section className="section">
      <PageHeader
        eyebrow="Reverse chronological"
        title="Everything, as it happened."
        lede="Reels, posts, moments, and essays in one unbroken stream — the whole record in the order it was made."
        accentHue={286}
        stats={[
          { value: entries.length, label: 'Entries' },
          ...(latest
            ? [
                {
                  value: new Date(`${latest}T00:00:00Z`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  }),
                  label: 'Latest',
                },
              ]
            : []),
        ]}
      />
      <FeedTimeline entries={entries} />
    </section>
  )
}
