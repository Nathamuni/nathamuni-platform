import Link from 'next/link'
import type { Video } from '@/lib/videos'
import { VideoCard } from '@/components/video/VideoCard'

/**
 * The "Start here" and "Latest drops" grids.
 *
 * Server-rendered from the `videos` the home page already loaded. This used to be a
 * client component that fetched /videos.json (120KB) in an effect and rendered
 * "Loading..." in the meantime — for the largest above-the-fold section on the site,
 * while app/page.tsx had the very same data available synchronously.
 *
 * Ordering matches the previous behaviour exactly: getAllVideos() applies the same
 * publishedDate-descending sort the effect used to redo on the client.
 */
export function VideoSections({ videos }: { videos: Video[] }) {
  // One card per category, always the newest in that category — replaces a
  // hand-picked "featured" flag that went stale the moment new videos landed.
  const latestByCategory: Video[] = []
  const seenCategories = new Set<string>()
  for (const video of videos) {
    if (seenCategories.has(video.category)) continue
    seenCategories.add(video.category)
    latestByCategory.push(video)
  }

  const latest = videos.filter((v) => (v.mediaType ?? 'reel') === 'reel').slice(0, 4)
  const totalCount = videos.length

  return (
    <>
      <section className="section" aria-labelledby="featured-heading" data-reveal data-reveal-3d>
        <h2 id="featured-heading" className="section-title">
          Start here
        </h2>
        <p className="section-sub">The newest video from every pillar — always up to date.</p>
        <div className="video-grid" data-testid="featured-grid">
          {latestByCategory.map((video, i) => (
            <div key={video.id} className={`anim-fade-up anim-delay-${Math.min(i, 4)} h-full`}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="latest-heading" data-reveal data-reveal-3d>
        <div className="section-head-row">
          <div>
            <h2 id="latest-heading" className="section-title">
              Latest drops
            </h2>
            <p className="section-sub">Fresh from the feed.</p>
          </div>
        </div>
        <div className="video-grid" data-testid="latest-grid">
          {latest.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
        <Link href="/videos" className="link-more" data-testid="browse-all-link">
          Browse all {totalCount} videos →
        </Link>
      </section>
    </>
  )
}
