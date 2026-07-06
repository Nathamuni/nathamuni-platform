import Link from 'next/link'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="section coming-soon" data-testid="coming-soon">
      <h1 className="section-title">{title}</h1>
      <p>{description}</p>
      <Link href="/" className="link-more">
        ← Back home
      </Link>
    </section>
  )
}
