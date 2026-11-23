import type { Metadata } from 'next'
import { Fragment } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CopyButton } from '@/components/diet/CopyButton'
import {
  DIET_DISCLAIMER,
  DIET_LATEST_URL,
  formatBytes,
  formatDietDate,
  getDietReleases,
  getInstallGuides,
  type DietRelease,
} from '@/lib/diet'
import { SITE_URL } from '@/lib/site'

const latestRelease = getDietReleases()[0]

export const metadata: Metadata = {
  title: latestRelease
    ? `${latestRelease.displayName}: a free diet plugin for ChatGPT and Claude`
    : 'Diet plugin',
  description:
    latestRelease?.description ??
    'A free South Indian vegetarian diet plugin for ChatGPT, Claude and other AI apps.',
  alternates: { canonical: '/diet' },
}

const HUE = 142 // green, food

/** Renders the small Markdown subset used in steps and release notes: **bold**, `code`. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}

function Notes({ notes }: { notes: DietRelease['notes'] }) {
  if (!notes) return <p className="diet-muted">No release notes for this version.</p>
  return (
    <div className="diet-notes">
      {notes.text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((para) => (
          <p key={para.slice(0, 40)}>
            <Inline text={para.replace(/\s*\n\s*/g, ' ')} />
          </p>
        ))}
    </div>
  )
}

function EmptyState() {
  return (
    <section className="section diet-page" data-testid="diet-page">
      <PageHeader
        title="Diet plugin"
        lede="The first version is on its way. Check back soon."
        accentHue={HUE}
      />
    </section>
  )
}

export default function DietPage() {
  const releases = getDietReleases()
  const latest = releases[0]
  if (!latest) return <EmptyState />

  const guides = getInstallGuides(latest)
  const stableUrl = `${SITE_URL.replace(/^https?:\/\//, '')}${DIET_LATEST_URL}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: latest.displayName,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'ChatGPT, Claude',
    softwareVersion: latest.version,
    description: latest.description,
    downloadUrl: `${SITE_URL}${DIET_LATEST_URL}`,
    fileSize: formatBytes(latest.bytes),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    author: { '@type': 'Person', name: latest.developerName || 'Nathamuni', url: SITE_URL },
  }

  return (
    <section className="section diet-page" data-testid="diet-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title={latest.displayName}
        lede={latest.description}
        accentHue={HUE}
        stats={[
          { value: `v${latest.version}`, label: 'Latest version' },
          { value: formatBytes(latest.bytes), label: 'Download size' },
          { value: formatDietDate(latest.date), label: 'Updated' },
        ]}
      >
        <div className="diet-cta">
          <a
            href={latest.file}
            download
            className="social-button social-button-primary detail-cta"
            data-testid="diet-download"
          >
            Download v{latest.version} (.zip)
          </a>
          <a href="#install" className="social-button detail-cta">
            How to install
          </a>
        </div>
        <p className="diet-stable">
          <span>Link to share. It always downloads the newest version:</span>
          <span className="diet-stable-row">
            <code data-testid="diet-stable-url">{stableUrl}</code>
            <CopyButton text={`https://${stableUrl}`} label="Copy link" />
          </span>
        </p>
      </PageHeader>

      {latest.prompts.length > 0 && (
        <div className="diet-block" data-reveal>
          <h2 className="section-title">Things you can ask it</h2>
          <ul className="diet-prompts">
            {latest.prompts.map((prompt) => (
              <li key={prompt} className="glass-card">
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="diet-block" id="install" data-reveal>
        <h2 className="section-title">Install it</h2>
        <nav className="diet-jump" aria-label="Choose your AI app">
          {guides.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="detail-tag">
              {g.label}
            </a>
          ))}
        </nav>
        {guides.map((guide) => (
          <section
            key={guide.id}
            id={guide.id}
            className="glass-card diet-guide"
            aria-labelledby={`${guide.id}-title`}
            data-testid={`diet-guide-${guide.id}`}
          >
            <h3 id={`${guide.id}-title`}>{guide.label}</h3>
            <p className="diet-muted">{guide.intro}</p>
            <ol className="diet-steps">
              {guide.steps.map((step) => (
                <li key={step.text}>
                  <Inline text={step.text} />
                  {step.copy && (
                    <span className="diet-copyline">
                      <code>{step.copy}</code>
                      <CopyButton text={step.copy} />
                    </span>
                  )}
                  {step.shot && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.shot.src}
                      alt={step.shot.alt}
                      width={step.shot.width}
                      height={step.shot.height}
                      loading="lazy"
                      className="diet-shot"
                    />
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
        <p className="diet-muted">
          To update, download the newest version and add it the same way. Your chats stay where
          they are.
        </p>
      </div>

      <div className="diet-block" data-reveal>
        <h2 className="section-title">
          What&apos;s new in v{latest.version}
          {latest.notes?.title ? `: ${latest.notes.title}` : ''}
        </h2>
        <Notes notes={latest.notes} />
      </div>

      <div className="diet-block" data-reveal>
        <h2 className="section-title">All versions</h2>
        <ol className="diet-versions" data-testid="diet-versions">
          {releases.map((r, i) => (
            <li key={r.version} className="glass-card diet-version">
              <div className="diet-version-head">
                <span className="diet-version-num">v{r.version}</span>
                {i === 0 && <span className="diet-badge">Latest</span>}
                <span className="diet-muted">
                  {formatDietDate(r.date)}, {formatBytes(r.bytes)}
                </span>
                <a href={r.file} download className="diet-version-link">
                  Download
                </a>
              </div>
              {r.notes?.title && <p className="diet-version-title">{r.notes.title}</p>}
              {i > 0 && (
                <details>
                  <summary>Release notes</summary>
                  <Notes notes={r.notes} />
                </details>
              )}
              <p className="diet-hash" title="SHA-256 of the zip, to check the download">
                SHA-256 <code>{r.sha256}</code>
              </p>
            </li>
          ))}
        </ol>
      </div>

      <details className="diet-block glass-card diet-inside" data-reveal>
        <summary>What is inside the zip ({latest.files.length} files)</summary>
        <ul>
          {latest.files.map((f) => (
            <li key={f.path}>
              <code>{f.path}</code> <span className="diet-muted">{formatBytes(f.bytes)}</span>
            </li>
          ))}
        </ul>
        {latest.files.every((f) => /\.(md|json|txt)$/i.test(f.path)) && (
          <p className="diet-muted">Plain text instructions only. No code runs on your device.</p>
        )}
      </details>

      <p className="diet-disclaimer" data-reveal>
        {DIET_DISCLAIMER}
      </p>
    </section>
  )
}
