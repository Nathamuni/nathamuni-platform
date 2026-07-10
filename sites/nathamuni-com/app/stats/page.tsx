import type { Metadata } from 'next'
import Link from 'next/link'
import { getStats } from '@/lib/stats'
import { getCategoryMeta } from '@/lib/categoryMeta'

export const metadata: Metadata = {
  title: 'The library in numbers',
  description: 'Real numbers from the archive — updated automatically every day.',
  alternates: { canonical: '/stats' },
}

const tabularNums: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

function StatTile({
  value,
  label,
  delay,
}: {
  value: string | number
  label: string
  delay?: number
}) {
  return (
    <div
      className={`glass-card p-4 sm:p-5 flex flex-col gap-1 anim-fade-up${
        delay ? ` anim-delay-${delay}` : ''
      }`}
    >
      <span className="text-2xl sm:text-3xl font-display text-white" style={tabularNums}>
        {value}
      </span>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  )
}

export default function StatsPage() {
  const stats = getStats()
  const maxTimelineCount = Math.max(1, ...stats.timeline.map((t) => t.count))
  const cadence =
    stats.streak.currentCadenceDays !== null ? `~${Math.round(stats.streak.currentCadenceDays)}` : '—'

  return (
    <section className="section">
      <h1 className="section-title anim-fade-up">The library in numbers</h1>
      <p className="section-sub anim-fade-up anim-delay-1">
        Real numbers from the archive — updated automatically every day.
      </p>

      {/* ---------- headline tiles ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatTile value={stats.totals.videos} label="Videos" delay={1} />
        <StatTile value={stats.totals.reels} label="Reels" delay={2} />
        <StatTile value={stats.totals.posts} label="Photo posts" delay={3} />
        <StatTile value={stats.totals.stories} label="Stories archived" delay={4} />
        <StatTile value={stats.totals.categories} label="Categories" />
        <StatTile value={stats.featuredCount} label="Featured" />
        <StatTile value={stats.streak.longestStreakDays} label="Longest posting streak (days)" />
        <StatTile value={cadence} label="Avg. days between posts" />
      </div>

      {/* ---------- per-category bars ---------- */}
      <div className="mb-10">
        <h2 className="text-lg mb-4 anim-fade-up">By category</h2>
        <div className="flex flex-col gap-3">
          {stats.categoryShares.map((c) => {
            const meta = getCategoryMeta(c.category)
            return (
              <div key={c.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-white/80 truncate">
                    {meta.icon} {c.category}
                  </span>
                  <span className="text-white/50 shrink-0" style={tabularNums}>
                    {c.count} · {c.share.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.share}%`, background: `hsl(${meta.hue} 85% 60%)` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- posting timeline ---------- */}
      <div className="mb-10">
        <h2 className="text-lg mb-4 anim-fade-up">Posting timeline — last 12 months</h2>
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-end gap-1 sm:gap-2.5 h-28 sm:h-40">
            {stats.timeline.map((t) => (
              <div
                key={t.label}
                className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full"
                title={`${t.label}: ${t.count}`}
              >
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(4, (t.count / maxTimelineCount) * 100)}%`,
                    background: 'linear-gradient(to top, rgba(139,92,246,0.75), rgba(236,72,153,0.5))',
                  }}
                />
                <span className="text-[0.6rem] text-white/40 truncate w-full text-center">
                  {t.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- top tags ---------- */}
      <div className="mb-10">
        <h2 className="text-lg mb-4 anim-fade-up">Top tags</h2>
        <div className="flex flex-wrap gap-2">
          {stats.topTags.map((t) => (
            <Link key={t.tag} href={`/videos?tag=${encodeURIComponent(t.tag)}`} className="detail-tag">
              #{t.tag} <span className="text-white/40">· {t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ---------- most loved ---------- */}
      <div className="mb-10">
        <h2 className="text-lg mb-4 anim-fade-up">Most loved</h2>
        {stats.hasEngagementData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-white/60 uppercase tracking-widest">Most liked</h3>
              {stats.topLiked.map((v) => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="glass-card flex items-center gap-3 p-2.5 hover:border-white/30 transition-all"
                >
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br from-violet-600/40 to-pink-500/30" />
                  )}
                  <span className="text-sm text-white/80 flex-1 min-w-0 truncate">{v.title}</span>
                  <span className="text-xs text-white/50 shrink-0" style={tabularNums}>
                    {v.count.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm text-white/60 uppercase tracking-widest">Most commented</h3>
              {stats.topCommented.map((v) => (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="glass-card flex items-center gap-3 p-2.5 hover:border-white/30 transition-all"
                >
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br from-violet-600/40 to-pink-500/30" />
                  )}
                  <span className="text-sm text-white/80 flex-1 min-w-0 truncate">{v.title}</span>
                  <span className="text-xs text-white/50 shrink-0" style={tabularNums}>
                    {v.count.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/40">Like data appears after the next sync run.</p>
        )}
      </div>

      <p className="text-xs text-white/35 border-t border-white/10 pt-4">
        These numbers are computed automatically from the Instagram archive every day — no manual
        tally, no rounding tricks.
      </p>
    </section>
  )
}
