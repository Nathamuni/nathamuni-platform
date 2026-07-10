import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getReadingMinutes } from '@/lib/blog'
import { getCategoryMeta } from '@/lib/categoryMeta'

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
  return (
    <section className="section">
      <h1 className="section-title">Blog</h1>
      <p className="section-sub">
        The long-form versions — every idea tested on myself before it&apos;s written down.
      </p>
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
