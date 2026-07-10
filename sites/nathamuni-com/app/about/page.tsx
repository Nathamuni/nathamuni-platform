import type { Metadata } from 'next'
import { AboutContent } from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The arc, the experiments, and the principles behind Nathamuni: self-taught engineer, AI architect, and author who tests everything on himself before he teaches it.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutContent />
}
