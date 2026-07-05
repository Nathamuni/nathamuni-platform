import Link from 'next/link'

const PLACEHOLDERS = [
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books & Writings' },
  { href: '/projects', label: 'Projects' },
]

export function PlaceholdersRow() {
  return (
    <section className="section placeholders-row" data-testid="placeholders-row">
      <h2 className="section-title">More coming soon</h2>
      <div className="placeholders-grid">
        {PLACEHOLDERS.map((item) => (
          <Link key={item.href} href={item.href} className="placeholder-card">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
