import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Nav } from '@/components/layout/Nav'
import { ScrollReveal } from '@/components/fx/ScrollReveal'
import { ScrollProgress } from '@/components/fx/ScrollProgress'
import { Companion } from '@/components/fx/Companion'
import { BackToTop } from '@/components/fx/BackToTop'
import { Footer } from '@/components/layout/Footer'
import { SOCIAL_LINKS } from '@/lib/social'
import { SITE_URL } from '@/lib/site'
import { PROFILE } from '@/lib/profile'
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
}

export const viewport: Viewport = {
  themeColor: '#07070c',
}

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: PROFILE.name,
      alternateName: ['Nathamuni.com', 'nathamuni'],
      description: PROFILE.metaDescription,
      publisher: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en',
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: PROFILE.name,
      url: SITE_URL,
      image: `${SITE_URL}/images/generated/about-portrait.jpg`,
      jobTitle: PROFILE.jobTitle,
      description: PROFILE.metaDescription,
      knowsAbout: [
        'Artificial Intelligence',
        'Software Engineering',
        'Calisthenics',
        'Meditation',
        'Writing',
      ],
      homeLocation: { '@type': 'Place', name: 'Chennai, Tamil Nadu, India' },
      mainEntityOfPage: { '@id': `${SITE_URL}/#website` },
      sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Nav />
        <ScrollReveal />
        <ScrollProgress />
        <main>{children}</main>
        <Footer />
        <Companion />
        <BackToTop />
      </body>
    </html>
  )
}
