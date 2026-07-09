import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
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
              className="post-card"
              style={{ '--cat': meta.hue } as React.CSSProperties}
              data-testid="post-card"
            >
              <span className="video-card-category">{post.category}</span>
              <h2 className="post-card-title">{post.title}</h2>
              <p className="post-card-excerpt">{post.excerpt}</p>
              <span className="video-card-date">{formatDate(post.publishedDate)}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
