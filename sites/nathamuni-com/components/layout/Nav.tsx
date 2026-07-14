'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/feed', label: 'Feed' },
  { href: '/videos', label: 'Videos' },
  { href: '/moments', label: 'Moments' },
  { href: '/courses', label: 'Courses' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/blog', label: 'Blog' },
  { href: '/ask', label: 'Ask' },
]

/** "Who is Nathamuni" pages — grouped behind one dropdown to keep the bar scannable. */
const ABOUT_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/journey', label: 'Journey' },
  { href: '/projects', label: 'Projects' },
  { href: '/stats', label: 'Stats' },
  { href: '/books', label: 'Books' },
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

function AboutMenu({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const groupActive = ABOUT_LINKS.some((l) => isActive(pathname, l.href))

  useEffect(() => {
    if (!open) return
    function onOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Rendered OUTSIDE .site-nav-links: that list is masked for scroll-fade,
  // which erases anything painted beyond the bar — including this dropdown.
  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        className={groupActive ? 'is-active nav-menu-btn' : 'nav-menu-btn'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        data-testid="nav-about-menu"
      >
        About <span aria-hidden className="text-[0.6rem] opacity-70">▾</span>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[10rem] flex flex-col gap-0.5 rounded-2xl p-2 z-30"
          style={{
            background: 'rgba(13, 10, 31, 0.92)',
            border: '1px solid rgba(178, 148, 255, 0.25)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
          data-testid="nav-about-dropdown"
        >
          {ABOUT_LINKS.map((link) => (
            <li key={link.href} role="none">
              <Link
                role="menuitem"
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive(pathname, link.href)
                    ? 'text-white bg-violet-500/25'
                    : 'text-white/65 hover:text-white hover:bg-white/10'
                }`}
                aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
        <AboutMenu pathname={pathname} />
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
