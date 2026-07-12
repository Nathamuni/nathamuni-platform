import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug, getReadingMinutes } from '@/lib/blog'
import { getVideoBySlug } from '@/lib/videos'
import { getCategoryMeta } from '@/lib/categoryMeta'
import { SITE_URL } from '@/lib/site'
import { VideoCard } from '@/components/video/VideoCard'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      images: [{ url: '/images/generated/og-banner.jpg', width: 1200, height: 630 }],
    },
  }
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  const meta = getCategoryMeta(post.category)
  const relatedVideo = post.relatedVideoId ? getVideoBySlug(post.relatedVideoId) : undefined

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedDate,
    author: { '@type': 'Person', name: 'Nathamuni', url: SITE_URL },
    url: `${SITE_URL}/blog/${post.slug}`,
  }

  const readingMinutes = getReadingMinutes(post)

  return (
    <article className="section post-article" style={{ '--cat': meta.hue } as React.CSSProperties}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link
        href={`/videos?category=${encodeURIComponent(post.category)}`}
        className="detail-category-chip"
      >
        {meta.icon} {post.category}
      </Link>
      <h1 className="post-title">{post.title}</h1>
      <div className="flex items-center gap-3">
        <span className="video-detail-date">{formatDate(post.publishedDate)}</span>
        <span className="text-xs text-white/35">·</span>
        <span className="text-xs text-white/40">{readingMinutes} min read</span>
      </div>
      <div className="post-body" data-testid="post-body">
        {post.body.split('\n\n').map((block) => {
          if (block.startsWith('## ')) {
            const heading = block.slice(3)
            return (
              <h2
                key={heading}
                className="text-lg sm:text-xl text-white font-display mt-6 first:mt-0"
              >
                {heading}
              </h2>
            )
          }
          return <p key={block.slice(0, 32)}>{block}</p>
        })}
      </div>
      {post.references && post.references.length > 0 && (
        <aside
          className="mt-10 pt-6 border-t border-white/10 flex flex-col gap-3"
          data-testid="post-references"
        >
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-semibold">
            References
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {post.references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:brightness-125 transition-all break-words"
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/40 italic">
            Tested on myself first — external research linked where I lean on it.
          </p>
        </aside>
      )}
      {relatedVideo && (
        <aside className="post-related" data-testid="post-related">
          <h2 className="section-title">Watch the short version</h2>
          <div className="post-related-card">
            <VideoCard video={relatedVideo} />
          </div>
        </aside>
      )}
      <Link href="/blog" className="link-more">
        ← All posts
      </Link>
    </article>
  )
}
