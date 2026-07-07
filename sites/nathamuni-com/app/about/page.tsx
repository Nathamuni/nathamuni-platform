import type { Metadata } from 'next'
import { AboutContent } from '@/components/about/AboutContent'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who Nathamuni is: engineer, author, calisthenics athlete, and AI architect sharing ideas tested on himself first.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutContent />
}
