import { ThemedImage } from '@/components/ui/ThemedImage'

/**
 * The fixed layer behind every page: themed art, soft orbs and (optionally) a drifting
 * pattern. What shows, and how it moves, is driven entirely by <html data-theme>,
 * data-bg and data-motion in globals.css, so this renders the same markup for everyone
 * and needs no JS. The home hero keeps its own richer backdrop on top of this.
 */
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true" data-testid="site-backdrop">
      <div className="site-backdrop-art">
        <ThemedImage
          base="/images/generated/hero-bg"
          alt=""
          ariaHidden
          loading="eager"
          fetchPriority="low"
          className="site-backdrop-img"
        />
      </div>
      <span className="site-orb site-orb-1" />
      <span className="site-orb site-orb-2" />
      <div className="site-backdrop-patternwrap">
        <span className="site-backdrop-pattern" />
      </div>
    </div>
  )
}
