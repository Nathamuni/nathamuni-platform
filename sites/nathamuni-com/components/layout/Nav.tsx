import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/videos', label: 'Videos' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books' },
  { href: '/projects', label: 'Projects' },
]

export function Nav() {
  return (
    <nav className="site-nav" data-testid="site-nav">
      <Link href="/" className="site-nav-brand">
        Nathamuni
      </Link>
      <ul className="site-nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
