import type { Metadata } from "next";
import { CopyButton } from "@/components/diet/CopyButton";
import { DietGate } from "@/components/diet/DietGate";
import { Inline } from "@/components/diet/Inline";
import { InstallFlow } from "@/components/diet/InstallFlow";
import { StepGlyph } from "@/components/diet/StepGlyph";
import {
  DIET_DISCLAIMER,
  DIET_LATEST_URL,
  formatBytes,
  formatDietDate,
  getDietReleases,
  getInstallGuides,
  type DietRelease,
} from "@/lib/diet";
import { SITE_URL } from "@/lib/site";

const latestRelease = getDietReleases()[0];

export const metadata: Metadata = {
  title: latestRelease
    ? `${latestRelease.displayName}: a free diet plugin for ChatGPT and Claude`
    : "Diet plugin",
  description:
    latestRelease?.description ??
    "A free South Indian vegetarian diet plugin for ChatGPT, Claude and other AI apps.",
  alternates: { canonical: "/diet" },
};

function Notes({ notes }: { notes: DietRelease["notes"] }) {
  if (!notes)
    return <p className="diet-muted">No release notes for this version.</p>;
  return (
    <div className="diet-notes">
      {notes.text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((para) => (
          <p key={para.slice(0, 40)}>
            <Inline text={para.replace(/\s*\n\s*/g, " ")} />
          </p>
        ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="section diet-page" data-testid="diet-page">
      <header className="diet-hero">
        <h1 className="diet-title">Diet plugin</h1>
        <p className="diet-lede">
          The first version is on its way. Check back soon.
        </p>
      </header>
    </section>
  );
}

export default function DietPage() {
  const releases = getDietReleases();
  const latest = releases[0];
  if (!latest) return <EmptyState />;

  const guides = getInstallGuides(latest);
  const stableUrl = `${SITE_URL.replace(/^https?:\/\//, "")}${DIET_LATEST_URL}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: latest.displayName,
    applicationCategory: "HealthApplication",
    operatingSystem: "ChatGPT, Claude",
    softwareVersion: latest.version,
    description: latest.description,
    downloadUrl: `${SITE_URL}${DIET_LATEST_URL}`,
    fileSize: formatBytes(latest.bytes),
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    author: {
      "@type": "Person",
      name: latest.developerName || "Nathamuni",
      url: SITE_URL,
    },
  };

  return (
    <section className="section diet-page" data-testid="diet-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="diet-hero">
        <div className="diet-hero-main">
          <h1 className="diet-title">{latest.displayName}</h1>
          {latest.shortDescription && (
            <p className="diet-tagline">{latest.shortDescription}</p>
          )}
          <p className="diet-lede">{latest.description}</p>

          <div className="diet-cta">
            <a
              href={latest.file}
              download
              data-diet-gate
              data-diet-file={latest.file}
              className="diet-download"
              data-testid="diet-download"
            >
              <StepGlyph icon="download" className="diet-download-icon" />
              <span>Download v{latest.version}</span>
            </a>
            <a href="#install" className="diet-secondary">
              See install steps
            </a>
          </div>
        </div>

        <aside className="diet-hero-side" aria-label="Release details">
          <dl className="diet-facts">
            <div>
              <dt>Version</dt>
              <dd>v{latest.version}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(latest.bytes)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDietDate(latest.date)}</dd>
            </div>
            <div>
              <dt>Works in</dt>
              <dd>ChatGPT, Claude, any AI</dd>
            </div>
          </dl>

          <div className="diet-stable">
            <span>
              Share this link. It always downloads the newest version.
            </span>
            <span className="diet-stable-row">
              <a
                href={`https://${stableUrl}`}
                download
                data-diet-gate
                data-diet-file={latest.file}
                className="diet-stable-link"
              >
                <code data-testid="diet-stable-url">{stableUrl}</code>
              </a>
              <CopyButton text={`https://${stableUrl}`} label="Copy link" />
            </span>
          </div>
        </aside>
      </header>

      <div className="diet-block diet-install" id="install">
        <h2 className="diet-h2">Install it, step by step</h2>
        <p className="diet-sub">
          Pick your AI app. Each step shows exactly where to click.
        </p>
        <InstallFlow guides={guides} />
        <p className="diet-muted diet-center">
          To update, download the newest version and add it the same way. Your
          chats stay where they are.
        </p>
      </div>

      {latest.prompts.length > 0 && (
        <div className="diet-block">
          <h2 className="diet-h2">Then just ask</h2>
          <ul className="diet-prompts">
            {latest.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="diet-block diet-two">
        <div className="diet-card">
          <h2 className="diet-h3">
            What&apos;s new in v{latest.version}
            {latest.notes?.title ? <span>{latest.notes.title}</span> : null}
          </h2>
          <Notes notes={latest.notes} />
        </div>

        <div className="diet-card">
          <h2 className="diet-h3">All versions</h2>
          <ol className="diet-versions" data-testid="diet-versions">
            {releases.map((r, i) => (
              <li
                key={r.version}
                className={i === 0 ? "diet-version is-latest" : "diet-version"}
              >
                <div className="diet-version-head">
                  <span className="diet-version-num">v{r.version}</span>
                  {i === 0 && <span className="diet-badge">Latest</span>}
                  <a
                    href={r.file}
                    download
                    data-diet-gate
                    data-diet-file={r.file}
                    className="diet-version-link"
                  >
                    Download
                  </a>
                </div>
                <p className="diet-version-meta">
                  {formatDietDate(r.date)}, {formatBytes(r.bytes)}
                  {r.notes?.title ? `. ${r.notes.title}` : ""}
                </p>
                {i > 0 && (
                  <details>
                    <summary>Release notes</summary>
                    <Notes notes={r.notes} />
                  </details>
                )}
                <p
                  className="diet-hash"
                  title="SHA-256 of the zip, to check the download"
                >
                  SHA-256 <code>{r.sha256}</code>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <details className="diet-block diet-card diet-inside">
        <summary>What is inside the zip ({latest.files.length} files)</summary>
        <ul>
          {latest.files.map((f) => (
            <li key={f.path}>
              <code>{f.path}</code>{" "}
              <span className="diet-muted">{formatBytes(f.bytes)}</span>
            </li>
          ))}
        </ul>
        {latest.files.every((f) => /\.(md|json|txt)$/i.test(f.path)) && (
          <p className="diet-muted">
            Plain text instructions only. No code runs on your device.
          </p>
        )}
      </details>

      <p className="diet-disclaimer">{DIET_DISCLAIMER}</p>
      <DietGate />
    </section>
  );
}
