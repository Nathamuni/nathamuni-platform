import Link from 'next/link'
import { getAllVideos, getFeaturedVideos } from '@/lib/videos'
import { KineticPortrait } from '@/components/hero/KineticPortrait'
import { SocialButtons } from '@/components/layout/SocialButtons'
import { CategoryTiles } from '@/components/home/CategoryTiles'
import { VideoCard } from '@/components/video/VideoCard'
import { AboutPreview } from '@/components/about/AboutPreview'
import { PlaceholdersRow } from '@/components/layout/PlaceholdersRow'

export default function HomePage() {
  const videos = getAllVideos()
  const featured = getFeaturedVideos()
  const latest = videos.slice(0, 4)

  return (
    <>
      <section className="hero" data-testid="hero-section">
        <div className="hero-portrait">
          <KineticPortrait />
        </div>
        <div className="hero-copy anim-fade-up">
          <h1 className="hero-title">Fear lives in one place only... in your Mind 🗿</h1>
          <p className="hero-bio">
            ☬ Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect |
            Generalist
          </p>
          <p className="hero-promise">
            {videos.length} videos on discipline, calisthenics, and AI — tested on myself first.
            No endless scrolling: search them.
          </p>
          <Link href="/videos" className="hero-search" data-testid="hero-search-link">
            <span aria-hidden>🔍</span>
            <span>Search the library — try &ldquo;discipline&rdquo; or &ldquo;push-ups&rdquo;</span>
          </Link>
          <SocialButtons />
        </div>
      </section>

      <section className="section" aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="section-title">
          Pick your pillar
        </h2>
        <p className="section-sub">Everything is organized so you can find it — not scroll for it.</p>
        <CategoryTiles />
      </section>

      <section className="section" aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="section-title">
          Start here
        </h2>
        <p className="section-sub">Hand-picked — the videos that best explain how I think.</p>
        <div className="video-grid" data-testid="featured-grid">
          {featured.map((video, i) => (
            <div key={video.id} className={`anim-fade-up anim-delay-${Math.min(i, 4)}`}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="latest-heading">
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
          Browse all {videos.length} videos →
        </Link>
      </section>

      <AboutPreview />
      <PlaceholdersRow />
    </>
  )
}
