'use client'

import { useState } from 'react'
import type { DashboardData, Metric } from '@/lib/insights-dashboard'

/**
 * Interactive insights dashboard for /pulse. Multiple real-data charts (donut,
 * metric-driven bars, line, distribution, ranked tags) with a metric selector.
 * SVG, no chart deps. Every categorical mark is direct-labeled (identity is
 * never color-alone). Dark-surface theme to match the pulse page.
 */

const labelClass = 'text-[0.62rem] uppercase tracking-widest text-white/40'
const ink = 'rgba(236,233,255,0.88)'
const mut = 'rgba(236,233,255,0.5)'
const catColor = (hue: number, l = 60) => `hsl(${hue} 78% ${l}%)`

const METRICS: { key: Metric; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'engagement', label: 'Engagement %' },
]

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={labelClass}>{title}</h3>
        {sub && <span className="text-[0.6rem] text-white/35">{sub}</span>}
      </div>
      {children}
    </div>
  )
}

/** Category share donut. */
function Donut({ data }: { data: DashboardData }) {
  const total = data.totalPosts
  const R = 52
  const C = 2 * Math.PI * R
  // Precompute cumulative offsets so render stays side-effect-free.
  const segments = data.categories.reduce<{ c: (typeof data.categories)[number]; frac: number; offset: number }[]>(
    (acc, c) => {
      const frac = c.posts / total
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].frac : 0
      return [...acc, { c, frac, offset }]
    },
    []
  )
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 130 130" className="w-32 h-32 shrink-0 -rotate-90">
        {segments.map(({ c, frac, offset }) => (
          <circle
            key={c.category}
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke={catColor(c.hue)}
            strokeWidth="16"
            strokeDasharray={`${frac * C} ${C - frac * C}`}
            strokeDashoffset={-offset * C}
          >
            <title>{`${c.category}: ${c.posts} posts (${c.share.toFixed(0)}%)`}</title>
          </circle>
        ))}
        <circle cx="65" cy="65" r="34" fill="rgba(10,8,24,0.85)" />
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.categories.map((c) => (
          <div key={c.category} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: catColor(c.hue) }} />
            <span className="truncate" style={{ color: ink }}>{c.category}</span>
            <span className="ml-auto tabular-nums" style={{ color: mut }}>{c.share.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Metric-driven bar chart (weekday or category). */
function MetricBars({
  rows,
  metric,
}: {
  rows: { label: string; value: number; hue?: number; note: string }[]
  metric: Metric
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const fmt = (v: number) => (metric === 'engagement' ? `${v.toFixed(1)}%` : v.toLocaleString())
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-40">
      {rows.map((r) => {
        const pct = Math.max(3, (r.value / max) * 100)
        return (
          <div key={r.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
            <span className="text-[0.6rem] tabular-nums" style={{ color: mut }}>{fmt(r.value)}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${pct}%`,
                background: r.hue != null
                  ? `linear-gradient(180deg, ${catColor(r.hue, 66)}, ${catColor(r.hue, 46)})`
                  : 'linear-gradient(180deg, hsl(276 80% 68%), hsl(276 80% 46%))',
              }}
            >
              <title>{r.note}</title>
            </div>
            <span className="text-[0.58rem] text-center leading-tight" style={{ color: mut }}>{r.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Monthly cadence line + area. */
function MonthLine({ data }: { data: DashboardData }) {
  const W = 320
  const H = 120
  const pad = { l: 6, r: 6, t: 10, b: 18 }
  const max = Math.max(1, ...data.months.map((m) => m.posts))
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (data.months.length - 1)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const pts = data.months.map((m, i) => `${x(i)},${y(m.posts)}`).join(' ')
  const area = `${pad.l},${y(0)} ${pts} ${x(data.months.length - 1)},${y(0)}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      <defs>
        <linearGradient id="mArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(276 80% 60%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(276 80% 60%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#mArea)" />
      <polyline points={pts} fill="none" stroke="hsl(286 85% 72%)" strokeWidth="2" strokeLinejoin="round" />
      {data.months.map((m, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(m.posts)} r="2.6" fill="hsl(286 90% 80%)">
            <title>{`${m.label}: ${m.posts} posts · ${m.medER.toFixed(1)}% median engagement`}</title>
          </circle>
          <text x={x(i)} y={H - 5} textAnchor="middle" fontSize="7.5" fill={mut}>{m.label}</text>
        </g>
      ))}
    </svg>
  )
}

/** Horizontal ranked tag bars. */
function TagBars({ data }: { data: DashboardData }) {
  const max = Math.max(1, ...data.topTags.map((t) => t.count))
  return (
    <div className="flex flex-col gap-1.5">
      {data.topTags.slice(0, 8).map((t) => (
        <div key={t.tag} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 truncate" style={{ color: ink }}>#{t.tag}</span>
          <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(t.count / max) * 100}%`,
                background: `linear-gradient(90deg, hsl(210 80% 60%), hsl(280 80% 66%))`,
              }}
              title={`#${t.tag}: ${t.count} posts · ${t.medER.toFixed(1)}% median engagement`}
            />
          </div>
          <span className="w-6 text-right tabular-nums" style={{ color: mut }}>{t.count}</span>
        </div>
      ))}
    </div>
  )
}

/** Engagement-rate distribution histogram. */
function Distribution({ data }: { data: DashboardData }) {
  const max = Math.max(1, ...data.distribution.map((b) => b.count))
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.distribution.map((b) => (
        <div key={b.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
          <span className="text-[0.58rem] tabular-nums" style={{ color: mut }}>{b.count}</span>
          <div
            className="w-full rounded-t"
            style={{ height: `${Math.max(3, (b.count / max) * 100)}%`, background: 'linear-gradient(180deg, hsl(200 80% 60%), hsl(250 80% 52%))' }}
            title={`${b.count} posts at ${b.label} engagement`}
          />
          <span className="text-[0.55rem]" style={{ color: mut }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Follower growth line (fills in as daily snapshots accumulate). */
function Growth({ data }: { data: DashboardData }) {
  if (data.growth.length < 2) {
    return (
      <p className="text-xs" style={{ color: mut }}>
        Now {data.followers?.toLocaleString() ?? '—'} followers. A growth curve draws here as daily
        snapshots accumulate — {data.growth.length} captured so far.
      </p>
    )
  }
  const W = 320
  const H = 110
  const pad = { l: 8, r: 8, t: 12, b: 16 }
  const vals = data.growth.map((g) => g.followers)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (data.growth.length - 1)
  const y = (v: number) => pad.t + (1 - (v - min) / Math.max(1, max - min)) * (H - pad.t - pad.b)
  const pts = data.growth.map((g, i) => `${x(i)},${y(g.followers)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <polyline points={pts} fill="none" stroke="hsl(150 75% 55%)" strokeWidth="2" strokeLinejoin="round" />
      {data.growth.map((g, i) => (
        <circle key={i} cx={x(i)} cy={y(g.followers)} r="2.6" fill="hsl(150 80% 68%)">
          <title>{`${g.date}: ${g.followers.toLocaleString()} followers`}</title>
        </circle>
      ))}
    </svg>
  )
}

export function InsightsDashboard({ data }: { data: DashboardData }) {
  const [metric, setMetric] = useState<Metric>('posts')

  const weekdayRows = data.weekday.map((d) => {
    const value =
      metric === 'posts' ? d.posts : metric === 'likes' ? d.likes : metric === 'comments' ? d.comments : d.medER
    return {
      label: d.label,
      value,
      note: `${d.label}: ${d.posts} posts · ${d.likes.toLocaleString()} likes · ${d.medER.toFixed(1)}% median ER`,
    }
  })
  const categoryRows = data.categories.map((c) => {
    const value =
      metric === 'posts' ? c.posts : metric === 'likes' ? c.totalLikes : metric === 'comments' ? c.totalComments : c.medER
    return {
      label: c.category.split(' ')[0],
      value,
      hue: c.hue,
      note: `${c.category}: ${c.posts} posts · ${c.avgLikes} avg likes · ${c.medER.toFixed(1)}% median ER`,
    }
  })

  return (
    <div className="mt-8" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className={labelClass}>Insights dashboard</h3>
        <div className="flex gap-1 p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className="px-3 py-1 rounded-full text-[0.7rem] transition-colors"
              style={{
                background: metric === m.key ? 'rgba(178,148,255,0.28)' : 'transparent',
                color: metric === m.key ? '#fff' : mut,
              }}
              aria-pressed={metric === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="By weekday" sub={METRICS.find((m) => m.key === metric)?.label}>
          <MetricBars rows={weekdayRows} metric={metric} />
        </Card>
        <Card title="By category" sub={METRICS.find((m) => m.key === metric)?.label}>
          <MetricBars rows={categoryRows} metric={metric} />
        </Card>
        <Card title="Category mix" sub={`${data.totalPosts} posts`}>
          <Donut data={data} />
        </Card>
        <Card title="Posting cadence" sub="last 12 months">
          <MonthLine data={data} />
        </Card>
        <Card title="Top tags" sub="by frequency">
          <TagBars data={data} />
        </Card>
        <Card title="Engagement spread" sub="posts per rate band">
          <Distribution data={data} />
        </Card>
        <Card title="Follower growth" sub="daily">
          <Growth data={data} />
        </Card>
        <Card title="Format mix" sub={`${data.reels + data.photoPosts} items`}>
          <div className="flex items-center gap-4 h-40 justify-center">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-white tabular-nums">{data.reels}</span>
              <span className={labelClass}>Reels</span>
            </div>
            <div className="w-px h-14 bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-white tabular-nums">{data.photoPosts}</span>
              <span className={labelClass}>Photo posts</span>
            </div>
            <div className="w-px h-14 bg-white/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-white tabular-nums">{data.medianER.toFixed(1)}%</span>
              <span className={labelClass}>Median ER</span>
            </div>
          </div>
        </Card>
      </div>

      {!data.hasReach && (
        <p className="text-[0.7rem] text-white/35 mt-4">
          Reach, saves, shares and reel watch-time charts unlock automatically once the daily sync
          enriches per-post insights. Audience active-hours need your one screenshot.
        </p>
      )}
    </div>
  )
}
