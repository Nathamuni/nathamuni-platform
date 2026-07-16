import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSessions, getSessionBySlug } from '@/lib/sessions'
import { getVideoBySlug } from '@/lib/videos'
import { getPostBySlug } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'
import { DisclaimerCard } from '@/components/sessions/DisclaimerCard'
import { HealthTools } from '@/components/sessions/HealthTools'
import { MetricsTable } from '@/components/sessions/MetricsTable'
import { MetricTracker } from '@/components/sessions/MetricTracker'
import { SessionFlow } from '@/components/sessions/SessionFlow'
import { SessionTimeline } from '@/components/sessions/SessionTimeline'
import { StepTracker } from '@/components/sessions/StepTracker'
import { VideoCard } from '@/components/video/VideoCard'

export function generateStaticParams() {
  return getAllSessions().map((session) => ({ slug: session.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const session = getSessionBySlug(slug)
  if (!session) return {}
  return {
    title: session.title,
    description: session.promise,
    alternates: { canonical: `/sessions/${session.slug}` },
    openGraph: {
      type: 'article',
      title: session.title,
      description: session.promise,
      images: [{ url: '/images/generated/og-banner.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = getSessionBySlug(slug)
  if (!session) notFound()

  const relatedVideos = (session.relatedVideoIds ?? [])
    .map((id) => getVideoBySlug(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))

  const relatedPosts = (session.relatedBlogSlugs ?? [])
    .map((s) => getPostBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: session.title,
    description: session.promise,
    url: `${SITE_URL}/sessions/${session.slug}`,
    step: session.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.detail,
    })),
  }

  return (
    <article className="section ssn-session" style={{ '--cat': session.hue } as React.CSSProperties}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <span className="detail-category-chip">{session.durationLabel} · Session</span>
      <h1 className="post-title">{session.title}</h1>
      <p className="ssn-session-promise">{session.promise}</p>
      <p className="ssn-session-forwhom">For: {session.forWhom}</p>

      <DisclaimerCard />

      {session.healthTools && <HealthTools />}

      <SessionFlow slug={session.slug} steps={session.steps} promise={session.promise} />

      <SessionTimeline hue={session.hue} timeline={session.timeline} />

      <MetricsTable metrics={session.metrics} />
      <MetricTracker slug={session.slug} metrics={session.metrics} />

      <div className="ssn-session-protocol">
        <h2 className="section-title">The protocol</h2>
        <StepTracker slug={session.slug} steps={session.steps} />
      </div>

      {relatedPosts.length > 0 && (
        <aside className="ssn-session-reading" data-testid="session-related-posts">
          <h2 className="section-title">Read the deep dive</h2>
          <ul className="ssn-session-reading-list">
            {relatedPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="link-more">
                  {post.title} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {relatedVideos.length > 0 && (
        <aside data-testid="session-related-videos">
          <h2 className="section-title">Watch it</h2>
          <div className="related-grid">
            {relatedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </aside>
      )}

      <Link href="/sessions" className="link-more">
        ← All sessions
      </Link>

      <style>{`
        .ssn-session {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .ssn-session-promise {
          margin: -0.5rem 0 0;
          font-size: 1.05rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.85);
          max-width: 42rem;
        }
        .ssn-session-forwhom {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.45);
        }
        .ssn-session-reading-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </article>
  )
}
