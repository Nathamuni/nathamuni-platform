import { getAllVideos, getFeaturedVideos } from '@/lib/videos'
import { KineticPortrait } from '@/components/hero/KineticPortrait'
import { SocialButtons } from '@/components/layout/SocialButtons'
import { VideoExplorer } from '@/components/video/VideoExplorer'
import { AboutPreview } from '@/components/about/AboutPreview'
import { PlaceholdersRow } from '@/components/layout/PlaceholdersRow'

export default function HomePage() {
  const videos = getAllVideos()
  const featuredIds = getFeaturedVideos().map((video) => video.id)

  return (
    <>
      <section className="hero" data-testid="hero-section">
        <div className="hero-portrait">
          <KineticPortrait />
        </div>
        <div className="hero-copy">
          <p className="hero-bio">
            ☬ Fear lives in one place only... Thats in you Mind🗿
            <br />
            Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect |
            Generalist
          </p>
          <SocialButtons />
        </div>
      </section>

      <section className="section" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="section-title">
          Explore the library
        </h2>
        <VideoExplorer videos={videos} featuredIds={featuredIds} />
      </section>

      <AboutPreview />
      <PlaceholdersRow />
    </>
  )
}
