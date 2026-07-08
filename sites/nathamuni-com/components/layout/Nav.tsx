'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/videos', label: 'Videos' },
  { href: '/moments', label: 'Moments' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books' },
  { href: '/projects', label: 'Projects' },
]

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Nav() {
  const pathname = usePathname()
  return (
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
  )
}
