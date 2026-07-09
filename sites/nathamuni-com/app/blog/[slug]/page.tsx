import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
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
    openGraph: { type: 'article', title: post.title, description: post.excerpt },
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
      <span className="video-detail-date">{formatDate(post.publishedDate)}</span>
      <div className="post-body" data-testid="post-body">
        {post.body.split('\n\n').map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
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
