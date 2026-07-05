import Link from 'next/link'

export function AboutPreview() {
  return (
    <section className="section about-preview" data-testid="about-preview">
      <h2 className="section-title">About</h2>
      <p>
        I turn six months of testing 50 thinkers&apos; life philosophies, calisthenics
        training, and AI architecture work into short, useful videos — so you don&apos;t have
        to scroll to find the one that matters to you right now.
      </p>
      <Link href="/about" className="link-more" data-testid="about-preview-link">
        Read more →
      </Link>
    </section>
  )
}
