import Link from 'next/link'
import type { CredibilityLabel, Module } from '@/lib/courses'
import { getVideoBySlug } from '@/lib/videos'
import { getPostBySlug } from '@/lib/blog'
import { VideoCard } from '@/components/video/VideoCard'
import { CredibilityBadge } from './CredibilityBadge'
import { ActionChecklist } from './ActionChecklist'

const LABEL_ORDER: CredibilityLabel[] = ['tested', 'research', 'standard']

/**
 * One module, rendered as a numbered glass card built on native <details>.
 * The first module (index 0) ships open; the rest render collapsed. Because
 * <details> keeps its children in the DOM regardless of open state, every
 * module's full content — blocks, videos, actions, references — is present
 * in the server-rendered HTML for SEO and no-JS clients; only the visual
 * disclosure is client-side (native browser behaviour, no JS required).
 */
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
  const presentLabels = LABEL_ORDER.filter((label) =>
    courseModule.blocks.some((b) => b.label === label)
  )
  const actionCount = courseModule.actions.length

  return (
    <details
      className="crs-module glass-card"
      data-testid="course-module"
      open={index === 0}
    >
      <summary className="crs-module-summary">
        <span className="crs-module-num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="crs-module-summary-text">
          <span className="crs-module-title">{courseModule.title}</span>
          <span className="crs-module-summary-meta">
            <span className="crs-module-summary-chips" data-testid="module-label-chips">
              {presentLabels.map((label) => (
                <CredibilityBadge key={label} label={label} compact />
              ))}
            </span>
            <span className="crs-module-summary-count">
              {actionCount} action{actionCount === 1 ? '' : 's'}
            </span>
          </span>
        </span>
        <span className="crs-module-chevron" aria-hidden="true" />
      </summary>

      <div className="crs-module-body">
        <div className="crs-blocks">
          {courseModule.blocks.map((block, blockIndex) => (
            <div key={blockIndex} className="crs-block" data-testid="course-block">
              <CredibilityBadge label={block.label} />
              <p className="crs-block-lead">{block.lead}</p>
              {block.body.map((para, paraIndex) => (
                <p key={paraIndex} className="crs-block-para">
                  {para}
                </p>
              ))}
              {block.bullets && block.bullets.length > 0 && (
                <ul className="crs-block-bullets">
                  {block.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              )}
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
      </div>
    </details>
  )
}
