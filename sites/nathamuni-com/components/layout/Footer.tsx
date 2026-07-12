import Link from 'next/link'
import { PROFILE } from '@/lib/profile'
import { SocialButtons } from './SocialButtons'

interface FooterLink {
  href: string
  label: string
}

const EXPLORE_LINKS: FooterLink[] = [
  { href: '/', label: 'Home' },
  { href: '/feed', label: 'Feed' },
  { href: '/videos', label: 'Videos' },
  { href: '/moments', label: 'Moments' },
]

const READ_LINKS: FooterLink[] = [
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books' },
  { href: '/journey', label: 'Journey' },
  { href: '/about', label: 'About' },
]

const MORE_LINKS: FooterLink[] = [
  { href: '/projects', label: 'Projects' },
  { href: '/stats', label: 'Stats' },
  { href: '/ask', label: 'Ask' },
]

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="site-footer-col">
      <h3 className="site-footer-col-title">{title}</h3>
      <ul className="site-footer-col-links">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <p className="site-footer-brand-name">
            <span aria-hidden="true">{PROFILE.mark}</span> {PROFILE.name}
          </p>
          <p className="site-footer-tagline">{PROFILE.headline}</p>
        </div>

        <nav className="site-footer-nav" aria-label="Footer">
          <FooterColumn title="Explore" links={EXPLORE_LINKS} />
          <FooterColumn title="Read" links={READ_LINKS} />
          <FooterColumn title="More" links={MORE_LINKS} />
        </nav>
      </div>

      <div className="site-footer-bottom">
        <SocialButtons />
        <p className="site-footer-note">No servers. No trackers. Built to be searched.</p>
        <p className="site-footer-copy">&copy; {PROFILE.name}. All rights reserved.</p>
      </div>
    </footer>
  )
}
