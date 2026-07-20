import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getReadingMinutes } from '@/lib/blog'
import { getCategoryMeta } from '@/lib/categoryMeta'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Long-form writing from Nathamuni — systems, discipline, calisthenics, and ideas tested on himself first.',
  alternates: { canonical: '/blog' },
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BlogPage() {
  const posts = getAllPosts()
  const totalMinutes = posts.reduce((sum, p) => sum + getReadingMinutes(p), 0)
  return (
    <section className="section">
      <PageHeader
        eyebrow="Long form"
        title="The ideas, written out."
        lede="Where a reel runs sixty seconds, these run as long as the idea needs — every one tested on myself before it was written down."
        accentHue={262}
        stats={[
          { value: posts.length, label: 'Essays' },
          { value: totalMinutes, label: 'Min to read' },
        ]}
      />
      <div className="post-list">
        {posts.map((post) => {
          const meta = getCategoryMeta(post.category)
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="post-card group"
              style={{ '--cat': meta.hue } as React.CSSProperties}
              data-testid="post-card"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="video-card-category">
                  {meta.icon} {post.category}
                </span>
                <span className="text-[0.65rem] uppercase tracking-widest text-white/35 flex-shrink-0">
                  {getReadingMinutes(post)} min read
                </span>
              </div>
              <h2 className="post-card-title">{post.title}</h2>
              <p className="post-card-excerpt">{post.excerpt}</p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="video-card-date">{formatDate(post.publishedDate)}</span>
                <span className="text-xs text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all">
                  Read →
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
