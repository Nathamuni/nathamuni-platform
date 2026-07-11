import Link from 'next/link'
import type { FeedEntry, FeedKind } from '@/lib/feed'

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
 * Vertical, reverse-chronological timeline of the whole feed: a gradient
 * spine on the left, month dividers, and compact glass rows. Rows use
 * content-visibility:auto since a full feed easily runs past 200 entries.
 */
export function FeedTimeline({ entries }: { entries: FeedEntry[] }) {
  const groups = groupByMonth(entries)

  return (
    <div className="feed-timeline">
      <div className="feed-spine" aria-hidden />
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
                >
                  <span className="feed-row-thumb">
                    {entry.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.image} alt="" loading="lazy" className="feed-row-thumb-img" />
                    ) : (
                      <span className="feed-row-thumb-placeholder" aria-hidden />
                    )}
                  </span>
                  <span className="feed-row-body">
                    <span className="feed-row-top">
                      <span className={`feed-kind-badge feed-kind-${entry.kind}`}>
                        {KIND_LABEL[entry.kind]}
                      </span>
                      <span className="feed-row-date">{formatDate(entry.date)}</span>
                    </span>
                    <span className="feed-row-title">{entry.title}</span>
                    {entry.kind === 'blog' && entry.excerpt && (
                      <span className="feed-row-excerpt">{entry.excerpt}</span>
                    )}
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
          gap: 2.5rem;
          padding-left: 1.35rem;
        }
        .feed-spine {
          position: absolute;
          left: 0.3rem;
          top: 0.3rem;
          bottom: 0.3rem;
          width: 2px;
          background: linear-gradient(180deg, #8b5cf6, #ec4899, #22d3ee);
          opacity: 0.5;
          border-radius: 999px;
        }
        .feed-month-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-variant: small-caps;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 0.85rem;
        }
        .feed-rows {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .feed-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.55rem 0.9rem;
          border-radius: 1rem;
          background: rgba(148, 112, 255, 0.06);
          border: 1px solid rgba(178, 148, 255, 0.14);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          content-visibility: auto;
          contain-intrinsic-size: auto 88px;
        }
        .feed-row:hover {
          border-color: hsla(var(--cat, 262), 85%, 70%, 0.7);
          box-shadow: 0 14px 36px -14px hsla(var(--cat, 262), 85%, 55%, 0.5);
          transform: translateY(-2px);
        }
        .feed-row-thumb {
          flex-shrink: 0;
          display: block;
          width: 72px;
          height: 72px;
          border-radius: 0.85rem;
          overflow: hidden;
          background: radial-gradient(120% 120% at 30% 15%, hsla(var(--cat, 262), 70%, 45%, 0.4), rgba(13, 10, 31, 0.7) 72%);
        }
        .feed-row-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .feed-row-thumb-placeholder {
          display: block;
          width: 100%;
          height: 100%;
        }
        .feed-row-body {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
          flex: 1;
        }
        .feed-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .feed-kind-badge {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .feed-kind-blog { color: #c4b5fd; background: rgba(139, 92, 246, 0.18); }
        .feed-kind-reel { color: #67e8f9; background: rgba(34, 211, 238, 0.16); }
        .feed-kind-post { color: #f5a8e0; background: rgba(236, 72, 153, 0.16); }
        .feed-kind-story { color: #fda4af; background: rgba(244, 63, 94, 0.16); }
        .feed-row-date {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.35);
          flex-shrink: 0;
        }
        .feed-row-title {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .feed-row-excerpt {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 640px) {
          .feed-row-thumb { width: 56px; height: 56px; }
          .feed-row { padding: 0.5rem 0.65rem; gap: 0.65rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .feed-row { transition: none; }
        }
      `}</style>
    </div>
  )
}
