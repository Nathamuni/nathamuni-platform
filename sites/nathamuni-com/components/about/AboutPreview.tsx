import Link from 'next/link'
import { PROFILE } from '@/lib/profile'

export function AboutPreview() {
  return (
    <section className="section about-preview" data-testid="about-preview">
      <h2 className="section-title">About</h2>
      <p>{PROFILE.aboutShort}</p>
      <Link href="/about" className="link-more" data-testid="about-preview-link">
        Read more →
      </Link>
    </section>
  )
}
