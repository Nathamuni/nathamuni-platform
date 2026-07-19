import type { Metadata } from 'next'
import { buildPulseGraph } from '@/lib/pulse'
import { buildDashboard } from '@/lib/insights-dashboard'
import { PulseGraph } from '@/components/pulse/PulseGraph'
import { InsightsDashboard } from '@/components/pulse/InsightsDashboard'

export const metadata: Metadata = {
  title: 'Pulse — the content network, live',
  description:
    'A living map of every post, category, and tag on this account — node size is real engagement, connections are real shared themes, refreshed daily from Instagram.',
  alternates: { canonical: '/pulse' },
}

const labelClass = 'text-[0.65rem] uppercase tracking-widest text-white/40'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="font-display text-white leading-none text-2xl sm:text-3xl"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
      <span className={labelClass}>{label}</span>
    </div>
  )
}

export default function PulsePage() {
  const { nodes, edges, stats } = buildPulseGraph()
  const dashboard = buildDashboard()

  // Active-hours strip (0-23). Present only once the insights fetch supplies it.
  const hours = stats.onlineFollowersByHour
  const maxHour = hours ? Math.max(1, ...Object.values(hours)) : 1

  return (
    <section className="section">
      <div className="mb-6 sm:mb-8 max-w-2xl" data-reveal>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: stats.live ? '#4ade80' : '#facc15',
              boxShadow: stats.live ? '0 0 8px #4ade80' : '0 0 8px #facc15',
            }}
          />
          <h1 className={labelClass}>{stats.live ? 'Live signal' : 'Warming up'}</h1>
        </div>
        <h2 className="font-display text-white text-2xl sm:text-4xl leading-tight mb-2">
          The content network, alive.
        </h2>
        <p className="text-sm text-white/55 leading-relaxed">
          Every glowing node is a real post, category, or theme. Bigger nodes earned more
          engagement; the lines are themes they genuinely share. Pulses trace the strongest
          connections. It re-reads the real data each day — nothing here is decorative.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-6" data-reveal>
        <Stat value={stats.followers ? stats.followers.toLocaleString() : '—'} label="Followers" />
        <Stat value={String(stats.posts)} label="Posts mapped" />
        <Stat value={String(stats.categories)} label="Clusters" />
        <Stat value={`${stats.medianER.toFixed(1)}%`} label="Median engagement" />
        <Stat
          value={stats.reachLast30Days ? stats.reachLast30Days.toLocaleString() : '—'}
          label="Reach · 30d"
        />
      </div>

      <PulseGraph data={{ nodes, edges, stats }} />

      {/* Timing panel. Prefer real audience active-hours; until Instagram supplies
          them, show the real posting rhythm by weekday — never a dead placeholder. */}
      {hours && (
        <div className="mt-8" data-reveal>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className={labelClass}>When followers are online</h3>
            <span className="text-[0.6rem] text-white/35">live from Instagram insights</span>
          </div>
          <div className="flex items-end gap-[3px] h-16">
            {Array.from({ length: 24 }, (_, h) => {
              const v = hours[String(h)] ?? 0
              const pct = Math.max(4, (v / maxHour) * 100)
              const peak = v === maxHour
              return (
                <div
                  key={h}
                  title={`${h}:00 — ${v} online`}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${pct}%`,
                    background: peak ? 'rgba(74,222,128,0.9)' : 'rgba(178,148,255,0.5)',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[0.55rem] text-white/30 mt-1">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>
      )}

      <InsightsDashboard data={dashboard} />

      <p className="text-xs text-white/35 border-t border-white/10 pt-4 mt-8">
        Node size = real likes + comments. Connections = shared categories and tags. Follower and
        reach figures update daily from Instagram insights
        {stats.updatedAt ? ` (last synced ${stats.updatedAt})` : ''}. This is a visualization of
        real data, not a live AI.
      </p>
    </section>
  )
}
