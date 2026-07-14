'use client'

import { useEffect, useState, type KeyboardEvent } from 'react'
import type { Metric } from '@/lib/sessions'

interface MetricEntry {
  date: string
  value: number
}

function storageKey(slug: string, index: number): string {
  return `metrics-${slug}-${index}`
}

function isEntry(value: unknown): value is MetricEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MetricEntry).date === 'string' &&
    typeof (value as MetricEntry).value === 'number' &&
    Number.isFinite((value as MetricEntry).value)
  )
}

function loadEntries(slug: string, index: number): MetricEntry[] {
  try {
    const raw = window.localStorage.getItem(storageKey(slug, index))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry)
  } catch {
    /* localStorage unavailable (privacy mode) or corrupt — start fresh */
    return []
  }
}

function saveEntries(slug: string, index: number, entries: MetricEntry[]): void {
  try {
    window.localStorage.setItem(storageKey(slug, index), JSON.stringify(entries))
  } catch {
    /* privacy mode — tracker still works in-memory for this visit */
  }
}

/** 120×32 gradient sparkline over the last 7 entries, with a dot on the last point. */
function Sparkline({ entries, gradientId }: { entries: MetricEntry[]; gradientId: string }) {
  const recent = entries.slice(-7)
  if (recent.length < 2) return null

  const width = 120
  const height = 32
  const values = recent.map((e) => e.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (recent.length - 1)
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - 3 - ((v - min) / range) * (height - 6)
    return [x, y] as const
  })
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="ssn-tracker-spark"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#22d3ee" />
    </svg>
  )
}

/** Plain triangle glyphs, not emoji — up/down/flat vs the previous entry. */
function TrendArrow({ entries }: { entries: MetricEntry[] }) {
  if (entries.length < 2) {
    return (
      <span className="ssn-tracker-trend ssn-tracker-trend-flat" aria-label="Not enough data yet">
        &ndash;
      </span>
    )
  }
  const latest = entries[entries.length - 1].value
  const previous = entries[entries.length - 2].value
  if (latest > previous) {
    return (
      <span className="ssn-tracker-trend ssn-tracker-trend-up" aria-label="Trending up">
        &#9650;
      </span>
    )
  }
  if (latest < previous) {
    return (
      <span className="ssn-tracker-trend ssn-tracker-trend-down" aria-label="Trending down">
        &#9660;
      </span>
    )
  }
  return (
    <span className="ssn-tracker-trend ssn-tracker-trend-flat" aria-label="Holding flat">
      &#9644;
    </span>
  )
}

function MetricRow({ slug, metric, index }: { slug: string; metric: Metric; index: number }) {
  const [mounted, setMounted] = useState(false)
  const [entries, setEntries] = useState<MetricEntry[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setMounted(true)
    setEntries(loadEntries(slug, index))
  }, [slug, index])

  function logValue(): void {
    const trimmed = draft.trim()
    if (trimmed === '') return
    const value = Number(trimmed)
    if (!Number.isFinite(value)) return
    const next = [...entries, { date: new Date().toISOString(), value }]
    setEntries(next)
    saveEntries(slug, index, next)
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      logValue()
    }
  }

  function handleClear(): void {
    if (!window.confirm(`Clear all logged entries for ${metric.name}? This can't be undone.`)) return
    setEntries([])
    saveEntries(slug, index, [])
  }

  const latest = entries[entries.length - 1]
  const gradientId = `ssn-tracker-gradient-${slug}-${index}`

  return (
    <div className="ssn-tracker-row" data-testid={`metric-tracker-row-${index}`}>
      <div className="ssn-tracker-row-head">
        <span className="ssn-tracker-name">{metric.name}</span>
        {mounted && entries.length > 0 && (
          <button type="button" className="ssn-tracker-clear" onClick={handleClear}>
            clear
          </button>
        )}
      </div>

      <div className="ssn-tracker-input-row">
        <input
          type="number"
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Value"
          aria-label={`Log a value for ${metric.name}`}
          className="ssn-tracker-input"
        />
        <button type="button" className="ssn-tracker-log" onClick={logValue}>
          Log
        </button>
      </div>

      {mounted && entries.length > 0 && (
        <div className="ssn-tracker-stats">
          <span className="ssn-tracker-stat">
            <span className="ssn-tracker-stat-value tabular-nums">{latest.value}</span>
            <span className="ssn-tracker-stat-label">latest</span>
          </span>
          <span className="ssn-tracker-stat">
            <span className="ssn-tracker-stat-value tabular-nums">{entries.length}</span>
            <span className="ssn-tracker-stat-label">{entries.length === 1 ? 'entry' : 'entries'}</span>
          </span>
          <Sparkline entries={entries} gradientId={gradientId} />
          <TrendArrow entries={entries} />
        </div>
      )}
    </div>
  )
}

/**
 * Turns "The metrics" from a read-only table into something usable: a
 * quick-add row per metric, logged to localStorage under
 * `metrics-<slug>-<metricIndex>` — no accounts, nothing leaves the device.
 * Renders an empty shell (input + button, no stats) until mounted so SSR
 * output never mismatches a localStorage-hydrated client render.
 */
export function MetricTracker({ slug, metrics }: { slug: string; metrics: Metric[] }) {
  return (
    <div className="ssn-tracker glass-card" data-testid="metric-tracker">
      <h2 className="section-title ssn-tracker-title">Track it</h2>
      <div className="ssn-tracker-list">
        {metrics.map((metric, index) => (
          <MetricRow key={metric.name} slug={slug} metric={metric} index={index} />
        ))}
      </div>
      <p className="ssn-tracker-privacy">Logged only in your browser — nothing leaves this device.</p>

      <style>{`
        .ssn-tracker {
          padding: 1.4rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ssn-tracker-title {
          margin: 0;
        }
        .ssn-tracker-title::after {
          display: none;
        }
        .ssn-tracker-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ssn-tracker-row {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0.9rem 1rem;
          border-radius: 0.9rem;
          background: rgba(148, 112, 255, 0.05);
          border: 1px solid rgba(178, 148, 255, 0.14);
        }
        .ssn-tracker-row-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.6rem;
        }
        .ssn-tracker-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }
        .ssn-tracker-clear {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
          background: none;
          border: none;
          padding: 0.4rem 0.1rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          min-height: 44px;
        }
        .ssn-tracker-clear:hover {
          color: rgba(255, 255, 255, 0.7);
        }
        .ssn-tracker-input-row {
          display: flex;
          gap: 0.6rem;
        }
        .ssn-tracker-input {
          flex: 1 1 auto;
          min-width: 0;
          min-height: 44px;
          padding: 0.5rem 0.8rem;
          border-radius: 0.6rem;
          background: rgba(13, 10, 31, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #fff;
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
        }
        .ssn-tracker-input:focus-visible {
          outline: 2px solid rgba(34, 211, 238, 0.6);
          outline-offset: 1px;
        }
        .ssn-tracker-log {
          flex-shrink: 0;
          min-width: 4.5rem;
          min-height: 44px;
          padding: 0.5rem 1rem;
          border-radius: 0.6rem;
          background: rgba(34, 211, 238, 0.16);
          border: 1px solid rgba(34, 211, 238, 0.45);
          color: #67e8f9;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .ssn-tracker-log:hover {
          background: rgba(34, 211, 238, 0.28);
        }
        .ssn-tracker-stats {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          flex-wrap: wrap;
        }
        .ssn-tracker-stat {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .ssn-tracker-stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .ssn-tracker-stat-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.4);
        }
        .ssn-tracker-spark {
          margin-left: auto;
        }
        .ssn-tracker-trend {
          font-size: 0.85rem;
          line-height: 1;
        }
        .ssn-tracker-trend-up {
          color: #4ade80;
        }
        .ssn-tracker-trend-down {
          color: #fb7185;
        }
        .ssn-tracker-trend-flat {
          color: rgba(255, 255, 255, 0.4);
        }
        .ssn-tracker-privacy {
          margin: 0;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.35);
        }
        @media (max-width: 640px) {
          .ssn-tracker-stats {
            gap: 0.8rem;
          }
          .ssn-tracker-spark {
            margin-left: 0;
            order: 10;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
