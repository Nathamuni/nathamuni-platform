'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import type { DashboardData, Metric, PostLite } from '@/lib/insights-dashboard'

/**
 * Interactive insights dashboard for /pulse. Multiple real-data charts with a
 * metric selector, cursor-following tooltips (one delegated data-tip handler),
 * and click-to-drill: clicking any mark opens the actual posts behind it.
 * SVG, no chart deps. Every categorical mark is direct-labeled.
 */

const labelClass = 'text-[0.62rem] uppercase tracking-widest text-white/40'
const ink = 'rgba(236,233,255,0.88)'
const mut = 'rgba(236,233,255,0.5)'
const catColor = (hue: number, l = 60) => `hsl(${hue} 78% ${l}%)`

type Pick = (label: string, predicate: (p: PostLite) => boolean) => void

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

function Donut({ data, onPick }: { data: DashboardData; onPick: Pick }) {
  const total = data.totalPosts
  const R = 52
  const C = 2 * Math.PI * R
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
            className="cursor-pointer"
            data-tip={`${c.category}: ${c.posts} posts (${c.share.toFixed(0)}%) · ${c.medER.toFixed(1)}% median engagement`}
            onClick={() => onPick(`${c.category} — ${c.posts} posts`, (p) => p.category === c.category)}
          />
        ))}
        <circle cx="65" cy="65" r="34" fill="rgba(10,8,24,0.85)" />
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.categories.map((c) => (
          <button
            key={c.category}
            onClick={() => onPick(`${c.category} — ${c.posts} posts`, (p) => p.category === c.category)}
            className="flex items-center gap-2 text-xs text-left hover:opacity-80"
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: catColor(c.hue) }} />
            <span className="truncate" style={{ color: ink }}>{c.category}</span>
            <span className="ml-auto tabular-nums" style={{ color: mut }}>{c.share.toFixed(0)}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MetricBars({
  rows,
  metric,
}: {
  rows: { label: string; value: number; hue?: number; note: string; onClick: () => void }[]
  metric: Metric
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const fmt = (v: number) => (metric === 'engagement' ? `${v.toFixed(1)}%` : v.toLocaleString())
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-40">
      {rows.map((r) => {
        const pct = Math.max(3, (r.value / max) * 100)
        return (
          <button
            key={r.label}
            onClick={r.onClick}
            className="flex-1 h-full flex flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[0.6rem] tabular-nums" style={{ color: mut }}>{fmt(r.value)}</span>
            <div
              data-tip={r.note}
              className="w-full rounded-t-md transition-all cursor-pointer"
              style={{
                height: `${pct}%`,
                background: r.hue != null
                  ? `linear-gradient(180deg, ${catColor(r.hue, 66)}, ${catColor(r.hue, 46)})`
                  : 'linear-gradient(180deg, hsl(276 80% 68%), hsl(276 80% 46%))',
              }}
            />
            <span className="text-[0.58rem] text-center leading-tight" style={{ color: mut }}>{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MonthLine({ data, onPick }: { data: DashboardData; onPick: Pick }) {
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
          <circle
            cx={x(i)}
            cy={y(m.posts)}
            r="7"
            fill="hsl(286 90% 80%)"
            fillOpacity="0.001"
            className="cursor-pointer"
            data-tip={`${m.label}: ${m.posts} posts · ${m.medER.toFixed(1)}% median engagement`}
            onClick={() => onPick(`${m.label} — ${m.posts} posts`, (p) => p.monthKey === m.monthKey)}
          />
          <circle cx={x(i)} cy={y(m.posts)} r="2.6" fill="hsl(286 90% 80%)" style={{ pointerEvents: 'none' }} />
          <text x={x(i)} y={H - 5} textAnchor="middle" fontSize="7.5" fill={mut}>{m.label}</text>
        </g>
      ))}
    </svg>
  )
}

function TagBars({ data, onPick }: { data: DashboardData; onPick: Pick }) {
  const max = Math.max(1, ...data.topTags.map((t) => t.count))
  return (
    <div className="flex flex-col gap-1.5">
      {data.topTags.slice(0, 8).map((t) => (
        <button
          key={t.tag}
          onClick={() => onPick(`#${t.tag} — ${t.count} posts`, (p) => p.tags.includes(t.tag))}
          className="flex items-center gap-2 text-xs w-full"
        >
          <span className="w-20 shrink-0 truncate text-left" style={{ color: ink }}>#{t.tag}</span>
          <div
            className="flex-1 h-3.5 rounded-full overflow-hidden cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            data-tip={`#${t.tag}: ${t.count} posts · ${t.medER.toFixed(1)}% median engagement`}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(t.count / max) * 100}%`,
                background: `linear-gradient(90deg, hsl(210 80% 60%), hsl(280 80% 66%))`,
              }}
            />
          </div>
          <span className="w-6 text-right tabular-nums" style={{ color: mut }}>{t.count}</span>
        </button>
      ))}
    </div>
  )
}

function Distribution({ data, onPick }: { data: DashboardData; onPick: Pick }) {
  const max = Math.max(1, ...data.distribution.map((b) => b.count))
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.distribution.map((b) => (
        <button
          key={b.label}
          onClick={() => onPick(`${b.label} engagement — ${b.count} posts`, (p) => p.distBand === b.label)}
          className="flex-1 h-full flex flex-col items-center justify-end gap-1"
        >
          <span className="text-[0.58rem] tabular-nums" style={{ color: mut }}>{b.count}</span>
          <div
            className="w-full rounded-t cursor-pointer"
            style={{ height: `${Math.max(3, (b.count / max) * 100)}%`, background: 'linear-gradient(180deg, hsl(200 80% 60%), hsl(250 80% 52%))' }}
            data-tip={`${b.count} posts at ${b.label} engagement rate`}
          />
          <span className="text-[0.55rem]" style={{ color: mut }}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}

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
        <circle
          key={i}
          cx={x(i)}
          cy={y(g.followers)}
          r="6"
          fill="hsl(150 80% 68%)"
          className="cursor-pointer"
          data-tip={`${g.date}: ${g.followers.toLocaleString()} followers${g.reach30 ? ` · ${g.reach30.toLocaleString()} reach` : ''}`}
        />
      ))}
    </svg>
  )
}

/** Drill-down modal: the actual posts behind a clicked mark. */
function PostsModal({
  label,
  posts,
  onClose,
}: {
  label: string
  posts: PostLite[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(4,3,12,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(14,11,30,0.98)', border: '1px solid rgba(178,148,255,0.28)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
          <div>
            <div className={labelClass}>{posts.length} posts</div>
            <div className="text-sm font-medium" style={{ color: ink }}>{label}</div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none px-2" aria-label="Close">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-3 flex flex-col gap-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/videos/${p.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnail} alt="" className="w-11 h-14 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-11 h-14 rounded-lg shrink-0 bg-gradient-to-br from-violet-600/40 to-pink-500/30" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate" style={{ color: ink }}>{p.title}</div>
                <div className="text-[0.68rem]" style={{ color: mut }}>
                  {p.category} · {p.likes.toLocaleString()} likes · {p.comments} comments · {p.er.toFixed(1)}%
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InsightsDashboard({ data }: { data: DashboardData }) {
  const [metric, setMetric] = useState<Metric>('posts')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; w: number; text: string } | null>(null)
  const [drill, setDrill] = useState<{ label: string; posts: PostLite[] } | null>(null)

  const pick: Pick = (label, predicate) => {
    const subset = data.posts.filter(predicate).sort((a, b) => b.er - a.er)
    if (subset.length) setDrill({ label, posts: subset })
  }

  function onMove(e: React.MouseEvent) {
    const el = (e.target as Element).closest?.('[data-tip]')
    const wrap = wrapRef.current
    if (!el || !wrap) {
      setTip(null)
      return
    }
    const rect = wrap.getBoundingClientRect()
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, text: el.getAttribute('data-tip') || '' })
  }

  const weekdayRows = data.weekday.map((d) => {
    const value =
      metric === 'posts' ? d.posts : metric === 'likes' ? d.likes : metric === 'comments' ? d.comments : d.medER
    return {
      label: d.label,
      value,
      note: `${d.label}: ${d.posts} posts · ${d.likes.toLocaleString()} likes · ${d.medER.toFixed(1)}% median ER`,
      onClick: () => pick(`${d.label} — ${d.posts} posts`, (p) => p.weekday === d.label),
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
      onClick: () => pick(`${c.category} — ${c.posts} posts`, (p) => p.category === c.category),
    }
  })

  return (
    <div
      className="mt-8 relative"
      data-reveal
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => setTip(null)}
    >
      {tip && (
        <div
          className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg text-[0.72rem] leading-snug max-w-[240px]"
          style={{
            left: tip.x + 14,
            top: tip.y + 14,
            transform: tip.x > tip.w - 200 ? 'translateX(calc(-100% - 28px))' : undefined,
            background: 'rgba(13,10,31,0.96)',
            border: '1px solid rgba(178,148,255,0.4)',
            color: 'rgba(236,233,255,0.92)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
          }}
        >
          {tip.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className={labelClass}>Insights dashboard · <span className="text-white/30 normal-case tracking-normal">click any bar to see the posts</span></h3>
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
          <Donut data={data} onPick={pick} />
        </Card>
        <Card title="Posting cadence" sub="last 12 months">
          <MonthLine data={data} onPick={pick} />
        </Card>
        <Card title="Top tags" sub="by frequency">
          <TagBars data={data} onPick={pick} />
        </Card>
        <Card title="Engagement spread" sub="posts per rate band">
          <Distribution data={data} onPick={pick} />
        </Card>
        <Card title="Follower growth" sub="daily">
          <Growth data={data} />
        </Card>
        <Card title="Format mix" sub={`${data.reels + data.photoPosts} items`}>
          <div className="flex items-center gap-4 h-40 justify-center">
            <button onClick={() => pick(`Reels — ${data.reels}`, (p) => p.mediaType === 'reel')} className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-white tabular-nums">{data.reels}</span>
              <span className={labelClass}>Reels</span>
            </button>
            <div className="w-px h-14 bg-white/10" />
            <button onClick={() => pick(`Photo posts — ${data.photoPosts}`, (p) => p.mediaType === 'post')} className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-white tabular-nums">{data.photoPosts}</span>
              <span className={labelClass}>Photo posts</span>
            </button>
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

      {drill && <PostsModal label={drill.label} posts={drill.posts} onClose={() => setDrill(null)} />}
    </div>
  )
}
