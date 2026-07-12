import Link from 'next/link'
import { getAllVideos, getFeaturedVideos } from '@/lib/videos'
import { getAllStories } from '@/lib/stories'
import { PROFILE, rolesLine } from '@/lib/profile'
import { HeroPortrait } from '@/components/hero/HeroPortrait'
import { HeroParallax } from '@/components/hero/HeroParallax'
import { CursorAurora } from '@/components/fx/CursorAurora'
import { ScrollCue } from '@/components/fx/ScrollCue'
import { CountUp } from '@/components/fx/CountUp'
import { SocialButtons } from '@/components/layout/SocialButtons'
import { CategoryTiles } from '@/components/home/CategoryTiles'
import { VideoCard } from '@/components/video/VideoCard'
import { MomentsStrip } from '@/components/home/MomentsStrip'
import { AboutPreview } from '@/components/about/AboutPreview'
import { JoinBlock } from '@/components/join/JoinBlock'
import { PlaceholdersRow } from '@/components/layout/PlaceholdersRow'

export default function HomePage() {
  const videos = getAllVideos()
  const featured = getFeaturedVideos()
  const latest = videos.filter((v) => (v.mediaType ?? 'reel') === 'reel').slice(0, 4)
  const momentsCount = getAllStories().length

  return (
    <>
      <CursorAurora />
      <HeroParallax>
        <HeroPortrait />
        <div className="hero-copy">
          <p className="hero-eyebrow anim-fade-up">
            {PROFILE.mark} {rolesLine()}
          </p>
          <h1 className="hero-title anim-fade-up anim-delay-1">{PROFILE.name}</h1>
          <p className="hero-quote anim-fade-up anim-delay-2">{PROFILE.headline}</p>
          <p className="hero-promise anim-fade-up anim-delay-2">{PROFILE.promise}</p>
          <Link
            href="/videos"
            className="hero-search anim-fade-up anim-delay-3"
            data-testid="hero-search-link"
          >
            <span aria-hidden>🔍</span>
            <span>Search all {videos.length} — try &ldquo;discipline&rdquo; or &ldquo;push-ups&rdquo;</span>
          </Link>
          <div className="hero-stats anim-fade-up anim-delay-3" data-testid="hero-stats">
            <span className="hero-stat">
              <strong>
                <CountUp value={videos.length} />
              </strong>{' '}
              videos
            </span>
            <span className="hero-stat">
              <strong>
                <CountUp value={momentsCount} />
              </strong>{' '}
              moments
            </span>
            <span className="hero-stat">
              <strong>
                <CountUp value={1} />
              </strong>{' '}
              book
            </span>
          </div>
          <div className="anim-fade-up anim-delay-4">
            <SocialButtons />
          </div>
        </div>
      </HeroParallax>

      <ScrollCue />

      <div className="scroll-divider" aria-hidden />

      <section className="section" aria-labelledby="pillars-heading" data-reveal data-reveal-3d>
        <h2 id="pillars-heading" className="section-title">
          Pick your pillar
        </h2>
        <p className="section-sub">Everything is organized so you can find it — not scroll for it.</p>
        <CategoryTiles />
      </section>

      <section className="section" aria-labelledby="featured-heading" data-reveal data-reveal-3d>
        <h2 id="featured-heading" className="section-title">
          Start here
        </h2>
        <p className="section-sub">Hand-picked — the videos that best explain how I think.</p>
        <div className="video-grid" data-testid="featured-grid">
          {featured.map((video, i) => (
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
          Browse all {videos.length} videos →
        </Link>
      </section>

      <MomentsStrip />
      <AboutPreview />
      <JoinBlock />
      <PlaceholdersRow />
    </>
  )
}
