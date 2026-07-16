/**
 * Start-date + "where am I" math for runnable sessions. Storage rides the
 * synced `session-` prefix (see lib/progress.ts PROGRESS_PREFIXES) so a
 * signed-in visitor's start date follows them across devices. All date math
 * uses the visitor's LOCAL calendar day — "Day 2" begins at their midnight,
 * not 24 hours after starting.
 */
import { loadItem, saveItem } from './progress'
import type { TimelinePhase } from './sessions'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function runKey(slug: string): string {
  return `session-run-${slug}`
}

export function loadStartDate(slug: string): string | null {
  const raw = loadItem(runKey(slug))
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    const startedOn = (parsed as { startedOn?: unknown } | null)?.startedOn
    if (typeof startedOn === 'string' && ISO_DATE.test(startedOn)) return startedOn
  } catch {
    /* corrupt payload — treat as not started */
  }
  return null
}

export function saveStartDate(slug: string, isoDate: string): void {
  saveItem(runKey(slug), JSON.stringify({ startedOn: isoDate }))
}

export function clearStartDate(slug: string): void {
  saveItem(runKey(slug), JSON.stringify({}))
}

export function localIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 1-indexed calendar day of the session; day 2 starts at local midnight. */
export function dayOfSession(startedOn: string, now: Date = new Date()): number {
  const [y, m, d] = startedOn.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((today.getTime() - start.getTime()) / 86_400_000)
  return Math.max(1, diff + 1)
}

/**
 * Which phase is "now"? Last phase whose range contains `day` (so overlaps
 * resolve to the later, more specific phase); past the final range → the
 * last ranged phase; no ranged phases at all → -1.
 */
export function activePhaseIndex(timeline: TimelinePhase[], day: number): number {
  let containing = -1
  let lastRanged = -1
  for (let i = 0; i < timeline.length; i++) {
    const range = timeline[i].days
    if (!range) continue
    lastRanged = i
    if (day >= range[0] && day <= range[1]) containing = i
  }
  return containing !== -1 ? containing : lastRanged
}
