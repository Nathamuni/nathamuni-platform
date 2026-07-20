import type { Metadata } from 'next'
import { getProjects, type ProjectStatus } from '@/lib/projects'
import github from '@/lib/github.json'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    "Case studies from Nathamuni's build log: offline-first AI, automation systems, and the apps he shipped along the way.",
  alternates: { canonical: '/projects' },
}

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  live: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  internal: 'text-violet-300 border-violet-400/40 bg-violet-400/10',
  'in-progress': 'text-amber-300 border-amber-400/40 bg-amber-400/10',
  'student-era': 'text-white/50 border-white/20 bg-white/5',
}

export default function ProjectsPage() {
  const projects = getProjects()

  return (
    <section className="section" data-testid="projects-page">
      <PageHeader
        eyebrow="Shipped, not pitched"
        title="What I actually built."
        lede="The problem each one solved, what got built, and where it honestly stands today — including the ones that never left internal use."
        accentHue={192}
        stats={[
          { value: projects.length, label: 'Projects' },
          { value: github.publicRepos, label: 'Public repos' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" data-reveal>
        {projects.map((project) => (
          <div key={project.slug} className="glass-card p-5 sm:p-6 flex flex-col gap-3">
            <span
              className={`inline-block w-fit text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${STATUS_CLASSES[project.status]}`}
              data-testid={`project-status-${project.slug}`}
            >
              {project.statusLabel}
            </span>
            <h2 className="font-display text-lg sm:text-xl">{project.name}</h2>
            <p className="text-white/60 text-sm italic">{project.problem}</p>
            <p className="text-white/80 text-sm leading-relaxed">{project.built}</p>
            <ul className="video-card-tags mt-1">
              {project.stack.map((item) => (
                <li key={item}>
                  <span className="detail-tag">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-white/50 text-sm mt-8" data-reveal>
        That&apos;s the featured seven — sixteen-plus applications shipped in total, several on
        the Play Store, including a college game and a YouTube spam-comment finder-and-remover bot
        nobody asked for but everybody&apos;s inbox needed.
      </p>

      {github?.login && (
        <a
          href={github.url}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card mt-6 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 hover:border-white/30 transition-all"
          data-reveal
          data-testid="github-strip"
        >
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            On GitHub
          </span>
          <span className="text-sm text-white/75" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {github.publicRepos} public repos
          </span>
          <span className="text-sm text-white/75" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {github.followers} followers
          </span>
          <span className="text-sm text-violet-300 ml-auto">github.com/{github.login} →</span>
        </a>
      )}
    </section>
  )
}
