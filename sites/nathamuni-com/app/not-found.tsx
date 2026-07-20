import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { getAllVideos } from '@/lib/videos'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page does not exist — but the library does. Search it here.',
  robots: { index: false, follow: true },
}

/** Where a lost visitor most likely wanted to go. */
const EXITS = [
  { href: '/videos', label: 'Video library', note: 'Search every video by topic or tag' },
  { href: '/feed', label: 'The feed', note: 'Everything, newest first' },
  { href: '/pulse', label: 'Pulse', note: 'The live content network' },
  { href: '/ask', label: 'Ask', note: 'Put the question to the AI twin' },
]

export default function NotFound() {
  const videoCount = getAllVideos().length

  return (
    <section className="section">
      <PageHeader
        eyebrow="404 — nothing here"
        title="This page doesn't exist."
        lede="A link went stale, or the address has a typo. Nothing behind it was lost — the library is all still here."
        accentHue={340}
        stats={[
          { value: videoCount, label: 'Videos', href: '/videos' },
          { value: '5', label: 'Categories', href: '/videos' },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
        {EXITS.map((exit) => (
          <Link
            key={exit.href}
            href={exit.href}
            className="glass-card p-4 sm:p-5 flex flex-col gap-1 transition-colors hover:border-white/30"
          >
            <span className="text-white text-sm font-medium">{exit.label} →</span>
            <span className="text-xs text-white/45">{exit.note}</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-white/35 mt-8">
        Landed here from a link on this site?{' '}
        <Link href="/ask" className="text-white/60 underline underline-offset-2 hover:text-white">
          Tell me
        </Link>{' '}
        — broken links get fixed.
      </p>
    </section>
  )
}
