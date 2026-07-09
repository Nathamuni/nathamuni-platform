import Link from 'next/link'

const PLACEHOLDERS = [
  { href: '/blog', label: '📝 Blog — live' },
  { href: '/books', label: '📖 The Book' },
  { href: '/projects', label: '🛠 Projects — soon' },
]

export function PlaceholdersRow() {
  return (
    <section className="section placeholders-row" data-testid="placeholders-row">
      <h2 className="section-title">Read &amp; explore</h2>
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
