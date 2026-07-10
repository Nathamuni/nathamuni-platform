export function HeroPortrait() {
  return (
    <div className="hero-portrait-frame" data-testid="hero-portrait-frame">
      <span className="hero-portrait-ring" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/portrait-static.webp"
        alt="Nathamuni portrait"
        className="hero-portrait-img"
        fetchPriority="high"
        data-testid="hero-portrait-img"
      />
    </div>
  )
}
