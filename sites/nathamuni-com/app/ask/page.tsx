import type { Metadata } from 'next'
import { AskChat } from '@/components/ask/AskChat'

export const metadata: Metadata = {
  title: 'Ask',
  description:
    "Ask the AI twin of Nathamuni anything — grounded only in what he's actually published: discipline, calisthenics, AI builds, and the book.",
  alternates: { canonical: '/ask' },
}

export default function AskPage() {
  return (
    <section className="section">
      <h1 className="section-title">Ask</h1>
      <p className="section-sub">
        An AI twin trained on the published record — direct, tested-on-myself, no guru-speak.
      </p>
      <AskChat />
    </section>
  )
}
