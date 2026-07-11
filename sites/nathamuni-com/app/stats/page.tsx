import type { Metadata } from 'next'
import Link from 'next/link'
import { getStats } from '@/lib/stats'
import { getCategoryMeta } from '@/lib/categoryMeta'

export const metadata: Metadata = {
  title: 'The library in numbers',
  description:
    'Every video, post, and moment — counted honestly and updated automatically from Instagram every day.',
  alternates: { canonical: '/stats' },
}

const tabularNums: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

const labelClass = 'text-[0.65rem] uppercase tracking-widest text-white/40'

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
      className={`glass-card p-5 sm:p-6 flex flex-col gap-1.5 anim-fade-up${
        delay ? ` anim-delay-${delay}` : ''
      }`}
    >
      <span
        className="font-display text-white leading-none text-3xl sm:text-4xl"
        style={tabularNums}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className={labelClass}>{label}</span>
    </div>
  )
}

export default function StatsPage() {
  const stats = getStats()
  const maxTimelineCount = Math.max(1, ...stats.timeline.map((t) => t.count))
  const totalItems = stats.totals.videos + stats.totals.stories
  const firstMonth = stats.timeline[0]
  const lastMonth = stats.timeline[stats.timeline.length - 1]

  return (
    <section className="section">
      {/* ---------- hero ---------- */}
      <div className="mb-12 sm:mb-16 max-w-2xl" data-reveal>
        <h1 className={`${labelClass} mb-3 anim-fade-up`}>The library in numbers</h1>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed anim-fade-up anim-delay-1">
          Everything I&apos;ve put out, counted honestly — no rounding up, no cherry-picking.
        </p>
        <div className="mt-5 sm:mt-6 flex items-baseline gap-3 anim-fade-up anim-delay-2">
          <span
            className="font-display text-white leading-none text-[3.5rem] sm:text-[5.5rem] lg:text-[6.5rem]"
            style={tabularNums}
          >
            {totalItems.toLocaleString()}
          </span>
          <span className={`${labelClass} pb-1 sm:pb-2`}>items in the archive</span>
        </div>
      </div>

      {/* ---------- headline tiles ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16" data-reveal>
        <StatTile value={stats.totals.reels} label="Reels" delay={1} />
        <StatTile value={stats.totals.posts} label="Photo posts" delay={2} />
        <StatTile value={stats.totals.stories} label="Moments" delay={3} />
        <StatTile value={stats.totals.categories} label="Categories" delay={4} />
      </div>

      {/* ---------- where the time goes ---------- */}
      <div className="mb-12 sm:mb-16" data-reveal>
        <h2 className={`${labelClass} mb-5 sm:mb-6 anim-fade-up`}>Where the time goes</h2>
        <div className="flex flex-col gap-4 sm:gap-5">
          {stats.categoryShares.map((c) => {
            const meta = getCategoryMeta(c.category)
            return (
              <div key={c.category} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-white/75 truncate">{c.category}</span>
                  <span className="text-sm text-white/50 shrink-0" style={tabularNums}>
                    {c.share.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.share}%`,
                      background: `linear-gradient(90deg, hsl(${meta.hue} 85% 65%), hsl(${meta.hue} 85% 78%))`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- cadence ---------- */}
      <div className="mb-12 sm:mb-16" data-reveal>
        <h2 className={`${labelClass} mb-5 sm:mb-6 anim-fade-up`}>Cadence</h2>
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-24 sm:h-32 items-end">
          {stats.timeline.map((t, i) => {
            const isCurrent = i === stats.timeline.length - 1
            const heightPct = Math.max(6, (t.count / maxTimelineCount) * 100)
            return (
              <div key={t.label} className="h-full flex items-end">
                <div
                  tabIndex={0}
                  title={`${t.label}: ${t.count}`}
                  className="w-full rounded-t-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  style={{
                    height: `${heightPct}%`,
                    background: isCurrent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.32)',
                  }}
                />
              </div>
            )
          })}
        </div>
        {firstMonth && lastMonth && (
          <div className="flex justify-between text-[0.6rem] text-white/30 mt-2">
            <span>{firstMonth.label}</span>
            <span>{lastMonth.label}</span>
          </div>
        )}
        <p className="text-sm text-white/50 leading-relaxed mt-5">
          Longest posting streak:{' '}
          <span className="text-white/80" style={tabularNums}>
            {stats.streak.longestStreakDays}
          </span>{' '}
          {stats.streak.longestStreakDays === 1 ? 'day' : 'days'}.
          {stats.streak.currentCadenceDays !== null && (
            <>
              {' '}
              Averaging about{' '}
              <span className="text-white/80" style={tabularNums}>
                {Math.round(stats.streak.currentCadenceDays)}
              </span>{' '}
              days between posts.
            </>
          )}
        </p>
      </div>

      {/* ---------- what it's about ---------- */}
      <div className="mb-12 sm:mb-16" data-reveal>
        <h2 className={`${labelClass} mb-5 sm:mb-6 anim-fade-up`}>What it&apos;s about</h2>
        <div className="flex flex-wrap gap-2.5">
          {stats.topTags.map((t) => (
            <Link
              key={t.tag}
              href={`/videos?tag=${encodeURIComponent(t.tag)}`}
              className="detail-tag"
              style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
            >
              #{t.tag} <span className="text-white/35 ml-1" style={tabularNums}>{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ---------- most loved ---------- */}
      {stats.hasEngagementData && (
        <div className="mb-12 sm:mb-16" data-reveal>
          <h2 className={`${labelClass} mb-5 sm:mb-6 anim-fade-up`}>Most loved</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <h3 className={`${labelClass} mb-1`}>Most liked</h3>
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
              <h3 className={`${labelClass} mb-1`}>Most commented</h3>
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
        </div>
      )}

      <p className="text-xs text-white/35 border-t border-white/10 pt-4">
        Data updates automatically from Instagram, daily.
      </p>
    </section>
  )
}
