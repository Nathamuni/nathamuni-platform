import { SocialButtons } from '@/components/layout/SocialButtons'
import { PROFILE } from '@/lib/profile'

export function AboutContent() {
  return (
    <section className="section about-content" data-testid="about-content">
      <h1 className="section-title">About</h1>
      {PROFILE.aboutLong.map((paragraph) => (
        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
      ))}
      <SocialButtons />
    </section>
  )
}
