import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Nav } from '@/components/layout/Nav'
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
    images: [{ url: '/images/portrait-fallback.png', width: 1080, height: 1080 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: '#07070c',
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PROFILE.name,
  url: SITE_URL,
  image: `${SITE_URL}/images/portrait-fallback.png`,
  jobTitle: PROFILE.jobTitle,
  description: PROFILE.metaDescription,
  sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
