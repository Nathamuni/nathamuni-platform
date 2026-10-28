import { ThemedImage } from '@/components/ui/ThemedImage'

export function HeroPortrait() {
  return (
    <div className="hero-portrait-frame" data-testid="hero-portrait-frame">
      <span className="hero-portrait-ring" aria-hidden />
      <ThemedImage
        base="/images/generated/about-portrait"
        alt="Nathamuni portrait"
        className="hero-portrait-img"
        fetchPriority="high"
        testId="hero-portrait-img"
      />
    </div>
  )
}
