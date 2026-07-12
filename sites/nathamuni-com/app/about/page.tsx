import type { Metadata } from 'next'
import { AboutContent } from '@/components/about/AboutContent'
import { SITE_URL } from '@/lib/site'
import { PROFILE } from '@/lib/profile'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The arc, the experiments, and the principles behind Nathamuni: self-taught engineer, AI architect, and author who tests everything on himself before he teaches it.',
  alternates: { canonical: '/about' },
}

const profilePageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: { '@id': `${SITE_URL}/#person` },
  url: `${SITE_URL}/about`,
  name: `About ${PROFILE.name}`,
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      <AboutContent />
    </>
  )
}
