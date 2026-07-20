import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Nav } from '@/components/layout/Nav'
import { ScrollReveal } from '@/components/fx/ScrollReveal'
import { ScrollProgress } from '@/components/fx/ScrollProgress'
import { Companion } from '@/components/fx/Companion'
import { BackToTop } from '@/components/fx/BackToTop'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/components/account/AuthProvider'
import { AccountWidget } from '@/components/account/AccountWidget'
import { SaveNudgeHost } from '@/components/account/SaveNudge'
import { SOCIAL_LINKS } from '@/lib/social'
import { SITE_URL } from '@/lib/site'
import { PROFILE } from '@/lib/profile'
import { BOOK } from '@/lib/book'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-outfit',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
})

const defaultTitle = `${PROFILE.name} — Engineer, Author, Calisthenics, AI Architect`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s — ${PROFILE.name}`,
  },
  description: PROFILE.metaDescription,
  openGraph: {
    type: 'website',
    siteName: PROFILE.name,
    url: SITE_URL,
    title: defaultTitle,
    description: PROFILE.metaDescription,
    images: [{ url: '/images/generated/og-banner.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/generated/og-banner.jpg'],
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: '#07070c',
}

// Rich Person entity. The extra attributes (full name, education, location,
// expertise, authored book) exist to disambiguate this living creator from the
// historical Sri Vaishnava saint "Nathamuni" — the decisive factor for Google
// treating him as his own entity in branded search. @id makes the node
// referenceable so other pages' schema can point at the same person.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: PROFILE.name,
  alternateName: PROFILE.alternateNames,
  url: SITE_URL,
  mainEntityOfPage: SITE_URL,
  image: `${SITE_URL}/images/generated/about-portrait.jpg`,
  jobTitle: PROFILE.jobTitle,
  description: PROFILE.metaDescription,
  nationality: PROFILE.nationality,
  birthPlace: { '@type': 'Place', name: PROFILE.birthPlace },
  homeLocation: { '@type': 'Place', name: PROFILE.homeLocation },
  alumniOf: { '@type': 'CollegeOrUniversity', name: PROFILE.alumniOf },
  knowsAbout: PROFILE.knowsAbout,
  author: {
    '@type': 'Book',
    name: BOOK.title,
    author: { '@id': `${SITE_URL}/#person` },
  },
  sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube, PROFILE.githubUrl],
}

// A distinct WebSite node enables the sitelinks search box and names the site
// entity, so a branded query can surface the site's own search.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: PROFILE.name,
  description: PROFILE.metaDescription,
  publisher: { '@id': `${SITE_URL}/#person` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/videos?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AuthProvider>
          <Nav />
          <ScrollReveal />
          <ScrollProgress />
          <main>{children}</main>
          <Footer />
          <Companion />
          <AccountWidget />
          <SaveNudgeHost />
          <BackToTop />
        </AuthProvider>
      </body>
    </html>
  )
}
