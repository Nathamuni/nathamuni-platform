import type { Metadata } from 'next'
import { AskChat } from '@/components/ask/AskChat'
import { PageHeader } from '@/components/layout/PageHeader'
import { getAllVideos } from '@/lib/videos'

export const metadata: Metadata = {
  title: 'Ask',
  description:
    "Ask the AI twin of Nathamuni anything — grounded only in what he's actually published: discipline, calisthenics, AI builds, and the book.",
  alternates: { canonical: '/ask' },
}

export default function AskPage() {
  return (
    <section className="section">
      <PageHeader
        eyebrow="Grounded in the record"
        title="Ask the twin."
        lede="An AI trained only on what I've actually published — direct, tested-on-myself, no guru-speak. If it isn't in the record, it says so."
        accentHue={192}
        stats={[{ value: getAllVideos().length, label: 'Videos indexed', href: '/videos' }]}
      />
      <AskChat />
    </section>
  )
}
