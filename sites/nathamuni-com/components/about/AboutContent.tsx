import { SocialButtons } from '@/components/layout/SocialButtons'

export function AboutContent() {
  return (
    <section className="section about-content" data-testid="about-content">
      <h1 className="section-title">About</h1>
      <p>☬ Fear lives in one place only... Thats in you Mind🗿</p>
      <p>
        Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect |
        Generalist
      </p>
      <p>
        I spent six months putting the core ideas of 50 different thinkers to the test in my
        own life, and now I share what actually holds up — personal growth, calisthenics
        training, and the occasional roast of my own DMs — in short videos instead of long
        threads. This site exists so you can search and find the one that&apos;s useful to you
        right now, instead of scrolling for it.
      </p>
      <SocialButtons />
    </section>
  )
}
