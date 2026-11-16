import Link from 'next/link'
import { PROFILE } from '@/lib/profile'

export function AboutPreview() {
  return (
    <section className="section about-preview" data-testid="about-preview">
      <h2 className="section-title">About</h2>
      <p className="about-now-label" data-testid="about-now">
        {PROFILE.now.heading} · since {PROFILE.now.since}
      </p>
      <ul className="about-now-roles" aria-label="Current roles">
        {PROFILE.now.roles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
      <p>{PROFILE.aboutShort}</p>
      <Link href="/about" className="link-more" data-testid="about-preview-link">
        Read more →
      </Link>
    </section>
  )
}
