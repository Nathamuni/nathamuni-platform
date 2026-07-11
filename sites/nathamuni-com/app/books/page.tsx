import type { Metadata } from 'next'
import { BOOK } from '@/lib/book'
import { SOCIAL_LINKS } from '@/lib/social'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: `${BOOK.title} — the book`,
  description: `${BOOK.tagline} ${BOOK.pitch.slice(0, 120)}…`,
  alternates: { canonical: '/books' },
}

const bookJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: BOOK.title,
  author: { '@type': 'Person', name: BOOK.author, url: SITE_URL },
  datePublished: '2025-11-25',
  inLanguage: 'en',
  url: `${SITE_URL}/books`,
}

export default function BooksPage() {
  return (
    <section className="section book-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <div
        className="glass-card book-banner overflow-hidden mb-8 aspect-[16/7] sm:aspect-[21/6]"
        data-reveal
        data-testid="book-banner"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/generated/books-teaser.jpg"
          alt="The Silence That Haunts — atmospheric banner"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 35%' }}
        />
        <div className="book-banner-fade" aria-hidden />
      </div>

      <div className="book-hero" data-reveal>
        <div className="book-cover" aria-hidden>
          <span className="book-cover-title">{BOOK.title}</span>
          <span className="book-cover-author">{BOOK.author}</span>
        </div>
        <div className="book-hero-copy">
          <span className="detail-category-chip" style={{ '--cat': 262 } as React.CSSProperties}>
            📖 {BOOK.edition}
          </span>
          <h1 className="post-title">{BOOK.title}</h1>
          <p className="book-tagline">{BOOK.tagline}</p>
          <p className="book-core">&ldquo;{BOOK.corePrinciple}&rdquo;</p>
          <p className="video-detail-description">{BOOK.pitch}</p>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noreferrer"
            className="social-button social-button-primary detail-cta"
            data-testid="book-cta"
          >
            DM me for a copy
          </a>
        </div>
      </div>

      <div className="book-parts" data-reveal>
        <h2 className="section-title">Inside the book</h2>
        <div className="book-parts-grid">
          {BOOK.parts.map((part) => (
            <div key={part.name} className="glass-card book-part">
              <h3>{part.name}</h3>
              <p>{part.line}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="book-quotes" data-reveal>
        <h2 className="section-title">From the pages</h2>
        {BOOK.quotes.map((quote) => (
          <blockquote key={quote.slice(0, 24)} className="book-quote">
            &ldquo;{quote}&rdquo;
          </blockquote>
        ))}
      </div>

      <div className="glass-card book-audience" data-reveal>
        <h2 className="section-title">Who it&apos;s for</h2>
        <p>{BOOK.audience}</p>
        <p className="book-promise">{BOOK.promise}</p>
      </div>
    </section>
  )
}
