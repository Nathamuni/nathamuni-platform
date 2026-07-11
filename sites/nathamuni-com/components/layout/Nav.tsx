'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/feed', label: 'Feed' },
  { href: '/videos', label: 'Videos' },
  { href: '/moments', label: 'Moments' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books' },
  { href: '/projects', label: 'Projects' },
  { href: '/stats', label: 'Stats' },
  { href: '/journey', label: 'Journey' },
  { href: '/ask', label: 'Ask' },
]

/** The app-style bottom tab bar on mobile shows the four primary sections. */
const TAB_LINKS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/videos', label: 'Videos', icon: '▶' },
  { href: '/moments', label: 'Moments', icon: '✦' },
  { href: '/about', label: 'About', icon: '☬' },
]

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Nav() {
  const pathname = usePathname()
  return (
    <>
      <nav className="site-nav" data-testid="site-nav">
        <Link href="/" className="site-nav-brand">
          Nathamuni
        </Link>
        <ul className="site-nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(pathname, link.href) ? 'is-active' : undefined}
                aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav className="tab-bar" aria-label="Primary" data-testid="tab-bar">
        {TAB_LINKS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={isActive(pathname, tab.href) ? 'tab-item is-active' : 'tab-item'}
            aria-current={isActive(pathname, tab.href) ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden>
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
