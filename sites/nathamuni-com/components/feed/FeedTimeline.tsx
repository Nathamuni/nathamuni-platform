import Link from 'next/link'
import type { FeedEntry, FeedKind } from '@/lib/feed'
import { Thumbnail } from '@/components/ui/Thumbnail'

/** First letter of the title, for the essay plate. Skips quotes and punctuation. */
function initialOf(title: string): string {
  const match = title.match(/\p{L}|\p{N}/u)
  return (match?.[0] ?? '·').toUpperCase()
}

const KIND_LABEL: Record<FeedKind, string> = {
  blog: 'Blog',
  reel: 'Reel',
  post: 'Post',
  story: 'Moment',
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

function monthLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

type IndexedEntry = FeedEntry & { globalIndex: number }

interface MonthGroup {
  key: string
  label: string
  entries: IndexedEntry[]
}

/**
 * Entries already arrive sorted newest-first, so consecutive same-month runs
 * collapse in one pass. Each entry is stamped with its position in the full
 * feed up front (globalIndex) so the render below can derive a capped
 * animation delay without mutating a counter across renders.
 */
function groupByMonth(entries: FeedEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  entries.forEach((entry, globalIndex) => {
    const key = monthKey(entry.date)
    const last = groups[groups.length - 1]
    const indexed: IndexedEntry = { ...entry, globalIndex }
    if (last && last.key === key) {
      last.entries.push(indexed)
    } else {
      groups.push({ key, label: monthLabel(entry.date), entries: [indexed] })
    }
  })
  return groups
}

/**
 * Reverse-chronological gallery of the whole feed, grouped by month.
 *
 * A grid rather than a list because the feed is overwhelmingly visual — reels,
 * posts and moments outnumber essays roughly thirty to one — so the image is the
 * thing being scanned and the title annotates it. Cards use
 * content-visibility:auto since a full feed runs past 200 entries.
 */
const FILTERS: { id: string; kind: FeedKind | null; label: string }[] = [
  { id: 'fk-all', kind: null, label: 'All' },
  { id: 'fk-reel', kind: 'reel', label: 'Reels' },
  { id: 'fk-post', kind: 'post', label: 'Posts' },
  { id: 'fk-story', kind: 'story', label: 'Moments' },
  { id: 'fk-blog', kind: 'blog', label: 'Essays' },
]

export function FeedTimeline({ entries }: { entries: FeedEntry[] }) {
  const groups = groupByMonth(entries)
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="feed-shell">
      <fieldset className="feed-filters" aria-label="Filter the feed by type">
        {FILTERS.map((f) => (
          <span key={f.id}>
            <input
              type="radio"
              name="feed-kind"
              id={f.id}
              className="feed-filter-input"
              defaultChecked={f.kind === null}
            />
            <label htmlFor={f.id} className="feed-filter-chip">
              {f.label}
              <span className="feed-filter-count">
                {f.kind === null ? entries.length : (counts[f.kind] ?? 0)}
              </span>
            </label>
          </span>
        ))}
      </fieldset>
    <div className="feed-timeline">
      {groups.map((group) => (
        <div key={group.key} className="feed-month" data-reveal>
          <h2 className="feed-month-label">{group.label}</h2>
          <div className="feed-rows">
            {group.entries.map((entry) => {
              const delay = (entry.globalIndex % 4) + 1
              return (
                <Link
                  key={`${entry.kind}-${entry.id}`}
                  href={entry.href}
                  className={`feed-row anim-fade-up anim-delay-${delay}`}
                  style={{ '--cat': entry.hue } as React.CSSProperties}
                  data-testid="feed-row"
                  data-kind={entry.kind}
                >
                  <span className="feed-row-thumb">
                    {entry.image ? (
                      <Thumbnail src={entry.image} alt="" loading="lazy" className="feed-row-thumb-img" />
                    ) : (
                      // Essays have no image. Setting the initial in the display face
                      // makes the cover belong to the piece; the flat gradient block it
                      // replaces carried nothing at all.
                      <span className="feed-row-plate" aria-hidden>
                        <span className="feed-row-plate-initial">{initialOf(entry.title)}</span>
                        <span className="feed-row-plate-rule" />
                        <span className="feed-row-plate-kicker">Essay</span>
                      </span>
                    )}
                    <span className={`feed-kind-badge feed-kind-${entry.kind}`}>
                      {KIND_LABEL[entry.kind]}
                    </span>
                  </span>
                  <span className="feed-row-body">
                    <span className="feed-row-title">{entry.title}</span>
                    <span className="feed-row-date">{formatDate(entry.date)}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
      <style>{`
        .feed-timeline {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 2.75rem;
        }
        .feed-month-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-variant: small-caps;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 0.9rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid rgba(178, 148, 255, 0.16);
        }
        /* A gallery, not a reading column: 236 of the 244 entries are images or video,
           so the artefact leads and the label follows it. The single wide row this
           replaces gave one entry per 1100px band and left the frame mostly empty. */
        .feed-rows {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
          gap: 1.1rem 1rem;
        }
        .feed-row {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          border-radius: 0.9rem;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          content-visibility: auto;
          contain-intrinsic-size: auto 300px;
        }
        .feed-row:hover { transform: translateY(-3px); }
        .feed-row-thumb {
          position: relative;
          display: block;
          aspect-ratio: 3 / 4;
          border-radius: 0.85rem;
          overflow: hidden;
          background: rgba(13, 10, 31, 0.55);
          border: 1px solid rgba(178, 148, 255, 0.14);
          transition: border-color 0.28s ease, box-shadow 0.28s ease;
        }
        .feed-row:hover .feed-row-thumb {
          border-color: hsla(var(--cat, 262), 85%, 70%, 0.6);
          box-shadow: 0 18px 40px -18px hsla(var(--cat, 262), 85%, 55%, 0.55);
        }
        .feed-row-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .feed-row-plate {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 0.5rem;
          width: 100%;
          height: 100%;
          padding: 0.9rem;
          background: linear-gradient(
            158deg,
            hsla(var(--cat, 262), 58%, 24%, 0.95),
            hsla(var(--cat, 262), 52%, 11%, 0.96)
          );
        }
        .feed-row-plate-initial {
          font-family: var(--font-display, inherit);
          font-size: 3.4rem;
          line-height: 0.85;
          font-weight: 600;
          color: hsla(var(--cat, 262), 92%, 88%, 0.95);
        }
        .feed-row-plate-rule {
          display: block;
          width: 1.75rem;
          height: 1px;
          background: hsla(var(--cat, 262), 85%, 78%, 0.5);
        }
        .feed-row-plate-kicker {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: hsla(var(--cat, 262), 70%, 84%, 0.75);
        }
        .feed-kind-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          padding: 0.18rem 0.45rem;
          border-radius: 999px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .feed-kind-blog { color: #ede9ff; background: rgba(139, 92, 246, 0.55); }
        .feed-kind-reel { color: #ecfeff; background: rgba(14, 116, 144, 0.6); }
        .feed-kind-post { color: #fdf2f8; background: rgba(157, 23, 106, 0.6); }
        .feed-kind-story { color: #fff1f2; background: rgba(159, 18, 57, 0.6); }
        .feed-row-body {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
          padding: 0 0.15rem;
        }
        .feed-row-title {
          font-size: 0.83rem;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.92);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .feed-row-date {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.55);
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 640px) {
          .feed-rows { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.9rem 0.75rem; }
          .feed-row-plate-initial { font-size: 2.6rem; }
          .feed-row { contain-intrinsic-size: auto 250px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .feed-row { transition: none; }
        }
        .feed-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          border: 0;
          padding: 0;
          margin: 0 0 1.75rem;
        }
        .feed-filter-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .feed-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.65);
          background: rgba(148, 112, 255, 0.08);
          border: 1px solid rgba(178, 148, 255, 0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: all 0.2s ease;
          min-height: 40px;
        }
        .feed-filter-count {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.55);
          font-variant-numeric: tabular-nums;
        }
        .feed-filter-chip:hover { border-color: rgba(178, 148, 255, 0.45); color: #fff; }
        .feed-filter-input:checked + .feed-filter-chip {
          color: #fff;
          background: linear-gradient(120deg, rgba(139, 92, 246, 0.35), rgba(236, 72, 153, 0.25));
          border-color: rgba(178, 148, 255, 0.6);
        }
        .feed-filter-input:focus-visible + .feed-filter-chip {
          outline: 2px solid rgba(139, 92, 246, 0.9);
          outline-offset: 2px;
        }
        .feed-shell:has(#fk-reel:checked) .feed-row:not([data-kind='reel']),
        .feed-shell:has(#fk-post:checked) .feed-row:not([data-kind='post']),
        .feed-shell:has(#fk-story:checked) .feed-row:not([data-kind='story']),
        .feed-shell:has(#fk-blog:checked) .feed-row:not([data-kind='blog']) {
          display: none;
        }
        .feed-shell:has(#fk-reel:checked) .feed-month:not(:has([data-kind='reel'])),
        .feed-shell:has(#fk-post:checked) .feed-month:not(:has([data-kind='post'])),
        .feed-shell:has(#fk-story:checked) .feed-month:not(:has([data-kind='story'])),
        .feed-shell:has(#fk-blog:checked) .feed-month:not(:has([data-kind='blog'])) {
          display: none;
        }
      `}</style>
    </div>
    </div>
  )
}
