import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How nathamuni.com and its automation tools handle data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="anim-fade-up">
      <section className="section">
        <header className="pg-head" style={{ '--pg-hue': 260 } as React.CSSProperties}>
          <span className="pg-head-eyebrow">Legal</span>
          <h1 className="pg-head-title">Privacy Policy</h1>
          <p className="pg-head-lede">Last updated: 2026-07-28</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-6 text-sm text-white/70 leading-relaxed">
          <p>
            nathamuni.com is a personal content site run by Nathamuni. This page covers the
            site itself and the internal automation that cross-posts content between
            platforms (Instagram → YouTube).
          </p>

          <h2 className="text-white text-base font-medium mt-6">What this site collects</h2>
          <p>
            No accounts, no trackers, no analytics cookies. The site is a static export with
            two visitor-facing features that store data: the &ldquo;Join&rdquo; email signup
            (email + optional text, used only to send occasional updates) and an anonymous
            question log for the AI &ldquo;Ask&rdquo; feature (question text only, no IP or
            identity stored).
          </p>

          <h2 className="text-white text-base font-medium mt-6">
            YouTube Data API — automation use
          </h2>
          <p>
            An internal script uses the YouTube Data API (scope:{' '}
            <code className="text-white/90">youtube.upload</code>) solely to upload Nathamuni&apos;s
            own Instagram reels to his own YouTube channel automatically. This runs on a
            private schedule, is not exposed to site visitors, and does not access, read, or
            share any other user&apos;s YouTube data. Access is limited to a single Google
            account owned by Nathamuni, and the API is used to upload video content and set
            title/description/tags only — nothing is read back except the resulting video ID.
          </p>

          <h2 className="text-white text-base font-medium mt-6">Data sharing</h2>
          <p>
            Data collected through this site or its automation is never sold or shared with
            third parties, except the platforms required to operate the feature itself
            (Google/YouTube for video hosting, Cloudflare for site infrastructure).
          </p>

          <h2 className="text-white text-base font-medium mt-6">Contact</h2>
          <p>
            Questions about this policy or a request to delete data: reach out via Instagram{' '}
            <a href="https://www.instagram.com/nathamuni_/" className="text-white underline">
              @nathamuni_
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
