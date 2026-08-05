import type { Metadata } from 'next'
import { SOCIAL_LINKS } from '@/lib/social'

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
            No trackers and no analytics cookies. The pages are a static export, but a
            Cloudflare Worker handles a few features that do store data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-white/90">Optional accounts.</strong> If you choose to
              create one, your email address and a hashed password (PBKDF2-SHA256) are stored.
              Sign-in uses a signed, HttpOnly cookie — not a tracking cookie. Accounts are
              entirely optional: signed out, everything still works and stays in your own
              browser only.
            </li>
            <li>
              <strong className="text-white/90">
                Progress, including health details you enter.
              </strong>{' '}
              While you are signed in, the progress saved on this device is copied to the
              server so it follows you to another one. That includes course and session
              checkmarks <em>and</em> anything you type into the session tools — body weight,
              height and whether you train (used for the BMI and protein calculators), plus
              any mood or metric entries you log. If you would rather this never leaves your
              device, simply do not create an account: signed out, none of it is ever sent.
            </li>
            <li>
              <strong className="text-white/90">Join signup.</strong> Email plus optional text,
              used only to send occasional updates.
            </li>
            <li>
              <strong className="text-white/90">Ask questions.</strong> Your question text is
              sent to Cloudflare Workers AI to generate an answer, and an anonymous log of the
              question text is kept. No name or account is attached to it.
            </li>
            <li>
              <strong className="text-white/90">Abuse protection.</strong> The Ask, sign-in and
              Join endpoints are rate-limited. That involves briefly keying a counter derived
              from your IP address; it is not stored as a record of your visit and is not used
              to profile you.
            </li>
          </ul>

          <h2 className="text-white text-base font-medium mt-6">Deleting your data</h2>
          <p>
            Message{' '}
            <a
              className="text-white/90 underline"
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              @nathamuni_ on Instagram
            </a>{' '}
            and your account, stored progress, and any join-list entry will be deleted. No
            account is required to use the site, and nothing here is shared with or sold to
            anyone.
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
