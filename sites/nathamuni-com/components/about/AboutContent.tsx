import Link from 'next/link'
import { SocialButtons } from '@/components/layout/SocialButtons'
import { PROFILE } from '@/lib/profile'

const EXPERIMENTS = [
  {
    title: '50 thinkers, 6 months',
    body: "I put roughly fifty different thinkers' philosophies to the test in my own life, one at a time, and kept only what produced a concrete result — sharper focus while coding, a longer handstand hold, a quieter ten minutes in meditation. Everything else got dropped, no matter how good it sounded on paper.",
  },
  {
    title: 'The solo marathon',
    body: 'No race, no bib, no supporters — I organized my own 26.21 km and ran it in 4 hours, 38 minutes, 32 seconds, alone.',
  },
  {
    title: 'The comeback',
    body: 'A back injury put me on bed rest for three months. Getting back to training after that taught me more about patience than the training itself ever did.',
  },
] as const

const PRINCIPLES = [
  {
    title: 'Preparedness over prediction',
    body: "I don't try to guess what happens next. I try to be ready for whatever does.",
  },
  {
    title: 'Systems over motivation',
    body: "Motivation is a mood. A system runs on the days the mood doesn't show up.",
  },
  {
    title: 'Sovereignty over convenience',
    body: "Local-first software, physical books, open source where it's an option — I'd rather own the thing than rent the convenience.",
  },
  {
    title: 'Generalist by design',
    body: 'Game dev to AI architecture to calisthenics to a published book — the breadth is the point, not a phase before specializing.',
  },
] as const

export function AboutContent() {
  return (
    <>
      <section className="section about-content" data-testid="about-content" data-reveal>
        <h1 className="section-title">About</h1>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 sm:items-center">
          <div
            className="glass-card w-48 sm:w-64 aspect-[4/5] overflow-hidden flex-shrink-0 mx-auto sm:mx-0"
            data-testid="about-portrait-frame"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/generated/about-portrait.jpg"
              alt="Nathamuni"
              className="w-full h-full object-cover"
              data-testid="about-portrait-img"
            />
          </div>
          <div className="flex flex-col gap-4 min-w-0">
            {PROFILE.aboutLong.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-white/80 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">The arc</h2>
        <p className="section-sub">Where the self-teaching habit actually came from.</p>
        <p className="text-white/80 leading-relaxed">
          School didn&apos;t come easy — ADHD made the classroom a losing game, and I struggled
          academically for years. So I built a different game: teach myself everything the
          classroom wasn&apos;t teaching me. Game development, app development, frontend,
          mathematics, hacking out of pure curiosity, 3D modelling, crafts — whatever pulled my
          attention, I went deep on it, often 10 to 11 hours a day.
        </p>
        <p className="text-white/80 leading-relaxed mt-4">
          I skipped the TV, the movies, the sports commentary — I never go behind entertainment —
          and put the hours somewhere else instead. That somewhere else eventually won hackathons.
          But I wasn&apos;t chasing an audience for any of it. Wanted to grow in the silence before
          exhibiting my process — the process came first, the talking about it came only once
          there was something worth showing.
        </p>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">Tested on myself first</h2>
        <p className="section-sub">The proof-of-work, not the theory.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXPERIMENTS.map((item) => (
            <div key={item.title} className="glass-card p-5 flex flex-col gap-2">
              <h3 className="font-display text-base">{item.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">What I build</h2>
        <p className="text-white/80 leading-relaxed">
          Most of what I build, for work and for myself, is offline-first, on-device AI — the kind
          that doesn&apos;t ship your data to a server you don&apos;t control. AI architecture work
          and offline-first mobile systems fill the weekdays; whatever idea outgrows a work laptop
          ships as its own app. Sixteen-plus applications later, here are the ones worth a proper
          write-up.
        </p>
        <Link href="/projects" className="link-more" data-testid="about-projects-link">
          See the build log →
        </Link>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">The quiet part</h2>
        <p className="text-white/80 leading-relaxed">
          The visible half of this is engineering and training. The other half happens at the
          temple and on the meditation mat, and I don&apos;t talk about it much — not because
          it&apos;s a secret, but because it&apos;s the part that doesn&apos;t perform well as
          content. I treat meditation as structural debugging for the human operating system: sit
          down, find where the process is stuck, fix it quietly, get back to work.
        </p>
        <blockquote className="glass-card p-5 mt-5 flex flex-col gap-2">
          <p lang="ta" className="font-display text-lg">
            யாதும் ஊரே யாவரும் கேளிர்
          </p>
          <p className="text-white/60 text-sm">
            &ldquo;Yaadhum oore yaavarum kelir&rdquo; — every town is my town, everyone is my kin.
          </p>
        </blockquote>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">The book</h2>
        <p className="text-white/80 leading-relaxed">
          <em>The Silence That Haunts</em> is my first book — self-authored, and printed as a
          physical book by deliberate choice. It&apos;s what surfaced when I turned the outside
          noise off and let the psychological truths underneath actually speak.
        </p>
        <p className="text-white/60 text-sm mt-3">
          Next book — <em>The Gray Man</em> — is already in the lab: a technical, behavioral manual
          on the neurobiology of decision-making, discipline, and cutting cognitive bias out of
          your own thinking.
        </p>
        <Link href="/books" className="link-more" data-testid="about-books-link">
          Read more about the book →
        </Link>
      </section>

      <section className="section" data-reveal>
        <h2 className="section-title">Principles</h2>
        <p className="section-sub">The operating rules behind all of the above.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((item) => (
            <div key={item.title} className="glass-card p-5 flex flex-col gap-1.5">
              <h3 className="font-display text-base">{item.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <SocialButtons />
        </div>
      </section>
    </>
  )
}
