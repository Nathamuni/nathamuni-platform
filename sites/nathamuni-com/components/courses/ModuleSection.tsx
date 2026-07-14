import Link from 'next/link'
import type { Module } from '@/lib/courses'
import { getVideoBySlug } from '@/lib/videos'
import { getPostBySlug } from '@/lib/blog'
import { VideoCard } from '@/components/video/VideoCard'
import { CredibilityBadge } from './CredibilityBadge'
import { ActionChecklist } from './ActionChecklist'

export function ModuleSection({
  courseSlug,
  courseModule,
  index,
}: {
  courseSlug: string
  courseModule: Module
  index: number
}) {
  const videos = (courseModule.videoIds ?? [])
    .map((id) => getVideoBySlug(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
  const posts = (courseModule.blogSlugs ?? [])
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const references = courseModule.blocks
    .map((b) => b.reference)
    .filter((r): r is NonNullable<typeof r> => Boolean(r))

  return (
    <section className="crs-module glass-card" data-testid="course-module">
      <h2 className="crs-module-title">
        <span className="crs-module-num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        {courseModule.title}
      </h2>

      <div className="crs-blocks">
        {courseModule.blocks.map((block, blockIndex) => (
          <div key={blockIndex} className="crs-block" data-testid="course-block">
            <CredibilityBadge label={block.label} />
            <p>{block.text}</p>
          </div>
        ))}
      </div>

      {videos.length > 0 && (
        <div className="video-grid crs-module-videos" data-testid="module-videos">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {posts.length > 0 && (
        <div className="crs-blog-links" data-testid="module-blog-links">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="crs-blog-card">
              <span className="crs-blog-card-label">Read the long version</span>
              <span className="crs-blog-card-title">{post.title}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="crs-actions-wrap">
        <h3 className="crs-actions-heading">Do this</h3>
        <ActionChecklist slug={courseSlug} moduleIndex={index} actions={courseModule.actions} />
      </div>

      {references.length > 0 && (
        <footer className="crs-refs" data-testid="module-references">
          <h3 className="crs-refs-heading">References</h3>
          <ul>
            {references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </section>
  )
}
