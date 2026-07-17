# Session Theater — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn session pages from static documents into runnable experiences: a visitor can Start a session (stored start date → live "Day 4 · Week 1" positioning on the timeline), enter a fullscreen Focus Mode that walks them one step at a time with screen wake-lock and a calm entry ritual, and get a completion ritual (mood check-in + summary) when every step is done.

**Architecture:** All client-side, zero server changes. New pure logic in `lib/sessionRun.ts` (start-date storage + day/phase math); three new client components (`SessionRunner`, `TheaterMode`, `CompletionRitual`) following the existing hydrate-after-mount pattern; `SessionTimeline` gains an optional `activeIndex` highlight prop; timeline phases gain machine-readable `days` ranges. Persistence rides the existing `session-`/`metrics-` localStorage prefixes so everything syncs for signed-in users with no changes to `lib/progress.ts` or the Worker.

**Tech Stack:** Next.js App Router (static export), React 19 client components, vitest + @testing-library/react, Screen Wake Lock API, Fullscreen API (with CSS overlay fallback), inline `<style>` blocks with `--cat` hue theming.

## Global Constraints

- Static export (`output: 'export'`): no new API routes, no server runtime.
- Hydration rule: components render identical SSR/first-paint output; localStorage is read only in `useEffect` after a `mounted` flip (StepTracker pattern).
- All `window`/`localStorage` access guarded and try/caught (privacy mode must not crash).
- Mobile-first mandatory; all animation must respect `prefers-reduced-motion`.
- Do NOT reintroduce the removed SessionSky (weather/sun animation). The ambient glow here is a static hue-tinted radial gradient only — no motion, no weather, no API. If the owner objects, it's a one-CSS-block removal.
- Persistence keys must start with `session-` or `metrics-` (the synced prefixes in `lib/progress.ts` `PROGRESS_PREFIXES`).
- Commit prefixes: `FEAT`/`FIX`/`TEST`/`REFACTOR`. Work on branch `feat/v26-session-theater`.
- All commands run from `sites/nathamuni-com/`.

**Failure mode watched:** hydration mismatch from date math — "Day N" depends on the visitor's clock, so it must never be rendered on the server or first client paint; SessionRunner renders a neutral "Start session" shell until mounted.

---

### Task 0: Branch

- [ ] **Step 1: Create the feature branch**

```bash
cd "/home/nathamuni/ Projects/Nathamuni-website" && git checkout -b feat/v26-session-theater
```

---

### Task 1: Timeline day ranges + `lib/sessionRun.ts` (pure logic)

**Files:**
- Modify: `sites/nathamuni-com/lib/sessions.ts` (TimelinePhase interface + the 4 session timelines)
- Create: `sites/nathamuni-com/lib/sessionRun.ts`
- Test: `sites/nathamuni-com/lib/sessionRun.test.ts`

**Interfaces:**
- Consumes: `loadItem`, `saveItem` from `@/lib/progress`; `TimelinePhase` from `@/lib/sessions`.
- Produces (used by Tasks 2–5):
  - `TimelinePhase.days?: [number, number]` — inclusive 1-indexed day range of a phase.
  - `runKey(slug: string): string` → `` `session-run-${slug}` ``
  - `loadStartDate(slug: string): string | null` — ISO `YYYY-MM-DD` or null
  - `saveStartDate(slug: string, isoDate: string): void`
  - `clearStartDate(slug: string): void`
  - `localIsoDate(now?: Date): string`
  - `dayOfSession(startedOn: string, now?: Date): number` — 1 on the start day
  - `activePhaseIndex(timeline: TimelinePhase[], day: number): number` — index of the current phase, `-1` if none matches, last ranged phase if past the end

- [ ] **Step 1: Add `days` to `TimelinePhase` and populate all four sessions**

In `lib/sessions.ts`, extend the interface (the `span: string` field is at line ~54):

```ts
export interface TimelinePhase {
  phase: string
  span: string
  /** Inclusive 1-indexed calendar-day range this phase covers. Omit for
   *  "ongoing / after every session" phases that have no fixed window. */
  days?: [number, number]
  focus: string
  stepIndexes: number[]
}
```

Add `days` to each timeline entry (match by existing `span` strings):

| Session | span | days |
|---|---|---|
| diet-reset | `'Day 0'` | `[1, 1]` |
| diet-reset | `'Week 1'` | `[2, 8]` |
| diet-reset | `'Weeks 2–4'` | `[9, 28]` |
| diet-reset | `'Weeks 8–12'` | `[50, 84]` |
| unlock-your-body | `'Weeks 1–2'` | `[1, 14]` |
| unlock-your-body | `'Week 3'` | `[15, 21]` |
| unlock-your-body | `'After every session'` | *(omit)* |
| unlock-your-body | `'Ongoing'` | *(omit)* |
| the-7-day-reset | `'Day 1'` | `[1, 1]` |
| the-7-day-reset | `'Days 1–7'` | `[2, 7]` |
| the-7-day-reset | `'Day 7'` | `[7, 7]` |
| ship-local-ai-in-a-weekend | `'Saturday morning'` | `[1, 1]` |
| ship-local-ai-in-a-weekend | `'Saturday afternoon'` | `[1, 1]` |
| ship-local-ai-in-a-weekend | `'Sunday'` | `[2, 2]` |

Note the-7-day-reset Day 1 vs Days 1–7 overlap resolution: `activePhaseIndex` picks the LAST matching range, so on day 1 the "Day 1" phase wins only because "Days 1–7" starts at day 2. On day 7 both `[2,7]` and `[7,7]` match → last one ("Day 7") wins, which is correct.

- [ ] **Step 2: Write the failing tests**

Create `lib/sessionRun.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import {
  activePhaseIndex,
  dayOfSession,
  loadStartDate,
  localIsoDate,
  runKey,
  saveStartDate,
  clearStartDate,
} from './sessionRun'
import { getAllSessions } from './sessions'
import type { TimelinePhase } from './sessions'

const TL: TimelinePhase[] = [
  { phase: 'Setup', span: 'Day 1', days: [1, 1], focus: '', stepIndexes: [0] },
  { phase: 'Run', span: 'Days 2–7', days: [2, 7], focus: '', stepIndexes: [1] },
  { phase: 'Close', span: 'Day 7', days: [7, 7], focus: '', stepIndexes: [2] },
  { phase: 'Ongoing', span: 'Ongoing', focus: '', stepIndexes: [3] },
]

describe('dayOfSession', () => {
  it('is 1 on the start day', () => {
    expect(dayOfSession('2026-07-16', new Date('2026-07-16T23:59:00'))).toBe(1)
  })
  it('counts calendar days, not 24h windows', () => {
    expect(dayOfSession('2026-07-16', new Date('2026-07-17T00:01:00'))).toBe(2)
  })
  it('clamps a future start date to 1', () => {
    expect(dayOfSession('2026-07-20', new Date('2026-07-16T12:00:00'))).toBe(1)
  })
})

describe('activePhaseIndex', () => {
  it('finds the containing phase', () => {
    expect(activePhaseIndex(TL, 1)).toBe(0)
    expect(activePhaseIndex(TL, 4)).toBe(1)
  })
  it('last matching range wins on overlap', () => {
    expect(activePhaseIndex(TL, 7)).toBe(2)
  })
  it('past the end sticks to the last ranged phase', () => {
    expect(activePhaseIndex(TL, 30)).toBe(2)
  })
  it('ignores phases without days and returns -1 for an unranged timeline', () => {
    expect(activePhaseIndex([TL[3]], 5)).toBe(-1)
  })
})

describe('start date storage', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips through the synced session- prefix', () => {
    expect(runKey('diet-reset')).toBe('session-run-diet-reset')
    saveStartDate('diet-reset', '2026-07-16')
    expect(loadStartDate('diet-reset')).toBe('2026-07-16')
  })
  it('returns null for missing, corrupt, or non-date payloads', () => {
    expect(loadStartDate('diet-reset')).toBeNull()
    window.localStorage.setItem('session-run-diet-reset', '{broken')
    expect(loadStartDate('diet-reset')).toBeNull()
    window.localStorage.setItem('session-run-diet-reset', JSON.stringify({ startedOn: 'yesterday' }))
    expect(loadStartDate('diet-reset')).toBeNull()
  })
  it('clearStartDate removes the date', () => {
    saveStartDate('diet-reset', '2026-07-16')
    clearStartDate('diet-reset')
    expect(loadStartDate('diet-reset')).toBeNull()
  })
})

describe('localIsoDate', () => {
  it('formats the local calendar date', () => {
    expect(localIsoDate(new Date(2026, 6, 16, 23, 30))).toBe('2026-07-16')
  })
})

describe('session timeline data', () => {
  it('every session has at least one ranged phase and ranges are valid', () => {
    for (const session of getAllSessions()) {
      const ranged = session.timeline.filter((p) => p.days)
      expect(ranged.length, session.slug).toBeGreaterThan(0)
      for (const p of ranged) {
        const [a, b] = p.days as [number, number]
        expect(a).toBeGreaterThanOrEqual(1)
        expect(b).toBeGreaterThanOrEqual(a)
      }
    }
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- sessionRun`
Expected: FAIL — `Cannot find module './sessionRun'` (or equivalent).

- [ ] **Step 4: Implement `lib/sessionRun.ts`**

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- sessionRun` — expected: all PASS. Also run `npm test -- sessions` to confirm the `days` additions didn't break existing timeline invariant tests.

- [ ] **Step 6: Commit**

```bash
git add lib/sessions.ts lib/sessionRun.ts lib/sessionRun.test.ts
git commit -m "FEAT: session start-date math + machine-readable timeline day ranges"
```

---

### Task 2: `SessionTimeline` active-phase highlight

**Files:**
- Modify: `sites/nathamuni-com/components/sessions/SessionTimeline.tsx`
- Test: `sites/nathamuni-com/components/sessions/SessionTimeline.test.tsx` (extend if it exists, create otherwise)

**Interfaces:**
- Produces: `SessionTimeline({ hue, timeline, activeIndex })` — `activeIndex?: number`; when it matches a phase index that `<li>` gets class `ssn-timeline-phase-active` and a "● Now" chip; `-1`/undefined renders exactly as today. Component stays presentational (no state) so it can be rendered from either server (today's usage) or the client SessionRunner (Task 3).

- [ ] **Step 1: Write the failing test**

Add to (or create) `components/sessions/SessionTimeline.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionTimeline } from './SessionTimeline'
import type { TimelinePhase } from '@/lib/sessions'

const TL: TimelinePhase[] = [
  { phase: 'Setup', span: 'Day 1', days: [1, 1], focus: 'Get ready', stepIndexes: [0] },
  { phase: 'Run', span: 'Days 2–7', days: [2, 7], focus: 'Do it', stepIndexes: [1] },
]

describe('SessionTimeline activeIndex', () => {
  it('marks the active phase with a Now chip', () => {
    render(<SessionTimeline hue={270} timeline={TL} activeIndex={1} />)
    const now = screen.getByText('Now')
    expect(now.closest('li')?.textContent).toContain('Run')
    expect(now.closest('li')?.className).toContain('ssn-timeline-phase-active')
  })
  it('renders no Now chip without activeIndex', () => {
    render(<SessionTimeline hue={270} timeline={TL} />)
    expect(screen.queryByText('Now')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SessionTimeline` — expected: FAIL (no "Now" chip rendered / unknown prop).

- [ ] **Step 3: Implement**

In `SessionTimeline.tsx`, change the signature and the `<li>`:

```tsx
export function SessionTimeline({
  hue,
  timeline,
  activeIndex,
}: {
  hue: number
  timeline: TimelinePhase[]
  activeIndex?: number
}) {
```

```tsx
<li
  key={block.phase}
  className={`ssn-timeline-phase${index === activeIndex ? ' ssn-timeline-phase-active' : ''}`}
  style={{ borderColor: `hsla(${hue}, 80%, ${58 + index * 6}%, 0.9)` }}
>
```

Inside the `<li>`, right after the `.ssn-timeline-span` element:

```tsx
{index === activeIndex && (
  <span className="ssn-timeline-now" data-testid="timeline-now">
    Now
  </span>
)}
```

Append to the `<style>` block:

```css
.ssn-timeline-phase-active {
  background: hsla(var(--cat), 70%, 55%, 0.08);
  border-radius: 0 0.6rem 0.6rem 0;
}
.ssn-timeline-now {
  align-self: flex-start;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  color: #0d0a1f;
  background: hsl(var(--cat) 85% 65%);
}
@media (min-width: 768px) {
  .ssn-timeline-phase-active {
    border-radius: 0 0 0.6rem 0.6rem;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SessionTimeline` — expected: PASS (new and pre-existing tests).

- [ ] **Step 5: Commit**

```bash
git add components/sessions/SessionTimeline.tsx components/sessions/SessionTimeline.test.tsx
git commit -m "FEAT: SessionTimeline active-phase highlight"
```

---

### Task 3: `SessionRunner` — start/reset + live day chip + live timeline

**Files:**
- Create: `sites/nathamuni-com/components/sessions/SessionRunner.tsx`
- Modify: `sites/nathamuni-com/app/sessions/[slug]/page.tsx`
- Test: `sites/nathamuni-com/components/sessions/SessionRunner.test.tsx`

**Interfaces:**
- Consumes: Task 1's `loadStartDate/saveStartDate/clearStartDate/localIsoDate/dayOfSession/activePhaseIndex`; Task 2's `SessionTimeline` with `activeIndex`; `earnSaveNudge` from `@/components/account/SaveNudge`.
- Produces: `SessionRunner({ slug, hue, durationLabel, timeline, children })` — a client component that REPLACES the bare `<SessionTimeline …/>` in the page. Not started → "Start this session" button + plain timeline. Started → "Day N · <phase name>" chip, timeline with `activeIndex`, subtle "restart" text button (uses `window.confirm`, same as MetricTracker's clear). `children` renders below the header row (Task 4 slots the Focus Mode button here). Dispatches window event `nm-session-started` on start (Task 4 listens).

- [ ] **Step 1: Write the failing test**

Create `components/sessions/SessionRunner.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SessionRunner } from './SessionRunner'
import { localIsoDate, loadStartDate, saveStartDate } from '@/lib/sessionRun'
import type { TimelinePhase } from '@/lib/sessions'

const TL: TimelinePhase[] = [
  { phase: 'Setup', span: 'Day 1', days: [1, 1], focus: 'Get ready', stepIndexes: [0] },
  { phase: 'Run', span: 'Days 2–7', days: [2, 7], focus: 'Do it', stepIndexes: [1] },
]

function renderRunner() {
  return render(
    <SessionRunner slug="test-session" hue={270} durationLabel="1 week" timeline={TL} />
  )
}

beforeEach(() => window.localStorage.clear())

describe('SessionRunner', () => {
  it('offers Start when not started, and no Now chip', () => {
    renderRunner()
    expect(screen.getByRole('button', { name: /start this session/i })).toBeTruthy()
    expect(screen.queryByText('Now')).toBeNull()
  })

  it('starting stores today and shows Day 1 + active phase', () => {
    renderRunner()
    fireEvent.click(screen.getByRole('button', { name: /start this session/i }))
    expect(loadStartDate('test-session')).toBe(localIsoDate())
    expect(screen.getByText(/day 1/i)).toBeTruthy()
    expect(screen.getByText('Now')).toBeTruthy()
  })

  it('an existing start date hydrates after mount', () => {
    saveStartDate('test-session', localIsoDate())
    renderRunner()
    expect(screen.getByText(/day 1/i)).toBeTruthy()
  })

  it('restart clears after confirm', () => {
    saveStartDate('test-session', localIsoDate())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderRunner()
    fireEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(loadStartDate('test-session')).toBeNull()
    expect(screen.getByRole('button', { name: /start this session/i })).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SessionRunner` — expected: FAIL, module not found.

- [ ] **Step 3: Implement `SessionRunner.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { TimelinePhase } from '@/lib/sessions'
import {
  activePhaseIndex,
  clearStartDate,
  dayOfSession,
  loadStartDate,
  localIsoDate,
  saveStartDate,
} from '@/lib/sessionRun'
import { earnSaveNudge } from '@/components/account/SaveNudge'
import { SessionTimeline } from './SessionTimeline'

/**
 * Makes a session runnable: Start button → start date in localStorage →
 * "Day N · Phase" positioning on the timeline. Renders the not-started shell
 * on SSR and first client paint (date math only after mount) so hydration
 * never mismatches — "Day N" depends on the visitor's clock.
 */
export function SessionRunner({
  slug,
  hue,
  durationLabel,
  timeline,
  children,
}: {
  slug: string
  hue: number
  durationLabel: string
  timeline: TimelinePhase[]
  children?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [startedOn, setStartedOn] = useState<string | null>(null)

  const rehydrate = useCallback(() => setStartedOn(loadStartDate(slug)), [slug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setMounted(true)
    rehydrate()
  }, [rehydrate])

  useEffect(() => {
    window.addEventListener('nm-progress-applied', rehydrate)
    return () => window.removeEventListener('nm-progress-applied', rehydrate)
  }, [rehydrate])

  function start() {
    const today = localIsoDate()
    saveStartDate(slug, today)
    setStartedOn(today)
    earnSaveNudge()
    window.dispatchEvent(new Event('nm-session-started'))
  }

  function restart() {
    if (!window.confirm('Restart this session? Your start date resets (step checks are kept).')) return
    clearStartDate(slug)
    setStartedOn(null)
  }

  const day = mounted && startedOn ? dayOfSession(startedOn) : null
  const active = day !== null ? activePhaseIndex(timeline, day) : -1
  const phaseName = active >= 0 ? timeline[active].phase : null

  return (
    <div className="ssn-runner" data-testid="session-runner">
      <div className="ssn-runner-bar">
        {day === null ? (
          <button type="button" className="ssn-runner-start" onClick={start}>
            ▶ Start this session
            <span className="ssn-runner-start-sub">{durationLabel} · tracked in your browser</span>
          </button>
        ) : (
          <p className="ssn-runner-status" aria-live="polite">
            <span className="ssn-runner-day tabular-nums">Day {day}</span>
            {phaseName && <span className="ssn-runner-phase">· {phaseName}</span>}
            <button type="button" className="ssn-runner-restart" onClick={restart}>
              restart
            </button>
          </p>
        )}
        {children}
      </div>
      <SessionTimeline hue={hue} timeline={timeline} activeIndex={active >= 0 ? active : undefined} />
      <style>{`
        .ssn-runner {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .ssn-runner-bar {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-wrap: wrap;
        }
        .ssn-runner-start {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
          padding: 0.7rem 1.2rem;
          border-radius: 0.85rem;
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.5);
          background: hsla(var(--cat), 70%, 55%, 0.14);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .ssn-runner-start:hover {
          background: hsla(var(--cat), 70%, 55%, 0.24);
        }
        .ssn-runner-start-sub {
          font-size: 0.68rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.55);
        }
        .ssn-runner-status {
          margin: 0;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ssn-runner-day {
          font-size: 1.15rem;
          font-weight: 800;
          color: hsl(var(--cat) 85% 70%);
        }
        .ssn-runner-phase {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .ssn-runner-restart {
          border: none;
          background: none;
          padding: 0;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .ssn-runner-restart:hover {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SessionRunner` — expected: PASS.

- [ ] **Step 5: Wire into the page**

In `app/sessions/[slug]/page.tsx`: import `SessionRunner` (drop the direct `SessionTimeline` import) and replace the line `<SessionTimeline hue={session.hue} timeline={session.timeline} />` with:

```tsx
<SessionRunner
  slug={session.slug}
  hue={session.hue}
  durationLabel={session.durationLabel}
  timeline={session.timeline}
/>
```

- [ ] **Step 6: Verify and commit**

Run: `npm test && npm run type-check && npm run lint` — expected: all green.

```bash
git add components/sessions/SessionRunner.tsx components/sessions/SessionRunner.test.tsx "app/sessions/[slug]/page.tsx"
git commit -m "FEAT: SessionRunner — start a session, live Day-N + active-phase timeline"
```

---

### Task 4: `TheaterMode` — fullscreen focus overlay with entry ritual + wake lock

**Files:**
- Create: `sites/nathamuni-com/components/sessions/TheaterMode.tsx`
- Modify: `sites/nathamuni-com/app/sessions/[slug]/page.tsx` (slot into SessionRunner)
- Modify: `sites/nathamuni-com/components/sessions/StepTracker.tsx` (rehydrate on step changes from theater)
- Test: `sites/nathamuni-com/components/sessions/TheaterMode.test.tsx`

**Interfaces:**
- Consumes: `Step`, `stepAnchorId` from `@/lib/sessions`; `loadItem`, `saveItem` from `@/lib/progress`. Reads/writes the SAME `` `session-${slug}` `` boolean[] key as StepTracker.
- Produces: `TheaterMode({ slug, hue, steps })` — renders a "⛶ Focus mode" button; clicking opens a `position: fixed` full-viewport overlay (`role="dialog"`, `aria-modal`) that: (1) runs a 4s "Settle in" entry ritual, (2) requests fullscreen on the overlay element (failure ignored — the fixed overlay IS the fallback), (3) acquires a screen wake lock (feature-detected, re-acquired on visibilitychange, released on close), (4) shows one step at a time (first unchecked) with a "Done — next step" button writing the shared key, (5) Exit button + Escape closes, restoring scroll. Dispatches `nm-session-steps-changed` on every step write. All-done state shows "Protocol complete" and a close button.
- StepTracker change: listen for `nm-session-steps-changed` with the existing `rehydrate` callback so checks made in theater appear in the list.

- [ ] **Step 1: Write the failing tests**

Create `components/sessions/TheaterMode.test.tsx`. Timers: the entry ritual uses `setTimeout`; use vitest fake timers. jsdom lacks `requestFullscreen`/`wakeLock` — the component must feature-detect both, so no mocking needed beyond their absence.

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { TheaterMode } from './TheaterMode'
import type { Step } from '@/lib/sessions'

const STEPS: Step[] = [
  { title: 'First move', label: 'tested', detail: 'Do the first thing.', checkpoint: 'first thing done' },
  { title: 'Second move', label: 'tested', detail: 'Do the second thing.', checkpoint: 'second thing done' },
]

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
})

function open() {
  render(<TheaterMode slug="test-session" hue={270} steps={STEPS} />)
  fireEvent.click(screen.getByRole('button', { name: /focus mode/i }))
}

describe('TheaterMode', () => {
  it('runs the entry ritual before showing the first unchecked step', () => {
    open()
    expect(screen.getByText(/settle in/i)).toBeTruthy()
    expect(screen.queryByText('First move')).toBeNull()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('First move')).toBeTruthy()
  })

  it('marking done persists to the shared session key and advances', () => {
    open()
    act(() => vi.advanceTimersByTime(4000))
    fireEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(JSON.parse(window.localStorage.getItem('session-test-session') ?? '[]')).toEqual([true, false])
    expect(screen.getByText('Second move')).toBeTruthy()
  })

  it('resumes at the first unchecked step', () => {
    window.localStorage.setItem('session-test-session', JSON.stringify([true, false]))
    open()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('Second move')).toBeTruthy()
  })

  it('shows completion when every step is done and Escape closes', () => {
    window.localStorage.setItem('session-test-session', JSON.stringify([true, true]))
    open()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText(/protocol complete/i)).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- TheaterMode` — expected: FAIL, module not found.

- [ ] **Step 3: Implement `TheaterMode.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Step } from '@/lib/sessions'
import { loadItem, saveItem } from '@/lib/progress'
import { CredibilityBadge } from './CredibilityBadge'

const ENTRY_MS = 4000

function storageKey(slug: string): string {
  return `session-${slug}`
}

function loadCompleted(slug: string, count: number): boolean[] {
  try {
    const raw = loadItem(storageKey(slug))
    if (!raw) return new Array(count).fill(false)
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return new Array(count).fill(false).map((_, i) => Boolean(parsed[i]))
    }
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  return new Array(count).fill(false)
}

/**
 * Fullscreen one-step-at-a-time focus overlay. Shares the `session-<slug>`
 * boolean[] with StepTracker (dispatching `nm-session-steps-changed` so the
 * list rehydrates). Fullscreen and Wake Lock are progressive enhancements —
 * both feature-detected, both failures swallowed; the fixed-position overlay
 * itself is the iOS-Safari fallback. The ambient glow is a static hue
 * gradient: no motion, so nothing to gate on prefers-reduced-motion.
 */
export function TheaterMode({ slug, hue, steps }: { slug: string; hue: number; steps: Step[] }) {
  const [open, setOpen] = useState(false)
  const [settled, setSettled] = useState(false)
  const [completed, setCompleted] = useState<boolean[]>(() => new Array(steps.length).fill(false))
  const overlayRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  const acquireWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
      }
      if (nav.wakeLock) wakeLockRef.current = await nav.wakeLock.request('screen')
    } catch {
      /* unsupported or denied — the session works without it */
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setSettled(false)
    void wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    document.body.style.overflow = ''
  }, [])

  function enter() {
    setCompleted(loadCompleted(slug, steps.length))
    setOpen(true)
    document.body.style.overflow = 'hidden'
    void overlayRef.current // fullscreen requested in the effect below, after the overlay exists
  }

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setSettled(true), ENTRY_MS)
    if (overlayRef.current?.requestFullscreen) {
      overlayRef.current.requestFullscreen().catch(() => {})
    }
    void acquireWakeLock()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) void acquireWakeLock()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, acquireWakeLock, close])

  function markCurrentDone() {
    setCompleted((prev) => {
      const index = prev.findIndex((done) => !done)
      if (index === -1) return prev
      const next = prev.slice()
      next[index] = true
      saveItem(storageKey(slug), JSON.stringify(next))
      window.dispatchEvent(new Event('nm-session-steps-changed'))
      return next
    })
  }

  const currentIndex = completed.findIndex((done) => !done)
  const allDone = currentIndex === -1
  const step = allDone ? null : steps[currentIndex]
  const doneCount = completed.filter(Boolean).length

  return (
    <>
      <button type="button" className="ssn-theater-open" onClick={enter}>
        ⛶ Focus mode
      </button>

      {open && (
        <div
          ref={overlayRef}
          className="ssn-theater"
          role="dialog"
          aria-modal="true"
          aria-label="Session focus mode"
          style={{ '--cat': hue } as React.CSSProperties}
        >
          {!settled ? (
            <div className="ssn-theater-entry">
              <p className="ssn-theater-entry-title">Settle in.</p>
              <p className="ssn-theater-entry-sub">One step at a time. Nothing else.</p>
            </div>
          ) : allDone ? (
            <div className="ssn-theater-step">
              <p className="ssn-theater-count">Protocol complete</p>
              <h3 className="ssn-theater-title">Every step is done. Well run.</h3>
              <button type="button" className="ssn-theater-done" onClick={close}>
                Finish
              </button>
            </div>
          ) : (
            step && (
              <div className="ssn-theater-step">
                <p className="ssn-theater-count tabular-nums">
                  Step {currentIndex + 1} of {steps.length} · {doneCount} done
                </p>
                <div className="ssn-theater-head">
                  <h3 className="ssn-theater-title">{step.title}</h3>
                  <CredibilityBadge label={step.label} />
                </div>
                <p className="ssn-theater-detail">{step.detail}</p>
                <p className="ssn-theater-checkpoint">Done when: {step.checkpoint}</p>
                <button type="button" className="ssn-theater-done" onClick={markCurrentDone}>
                  Done — next step
                </button>
              </div>
            )
          )}
          <button type="button" className="ssn-theater-exit" onClick={close}>
            Exit
          </button>

          <style>{`
            .ssn-theater {
              position: fixed;
              inset: 0;
              z-index: 100;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1.5rem;
              background:
                radial-gradient(120% 90% at 50% 110%, hsla(var(--cat), 70%, 40%, 0.22), transparent 60%),
                radial-gradient(100% 70% at 50% -20%, hsla(var(--cat), 80%, 55%, 0.12), transparent 55%),
                #0d0a1f;
            }
            .ssn-theater-entry {
              text-align: center;
              animation: ssn-theater-fade 1.2s ease both;
            }
            .ssn-theater-entry-title {
              margin: 0 0 0.5rem;
              font-size: 1.6rem;
              font-weight: 800;
              color: #fff;
            }
            .ssn-theater-entry-sub {
              margin: 0;
              font-size: 0.95rem;
              color: rgba(255, 255, 255, 0.55);
            }
            .ssn-theater-step {
              max-width: 34rem;
              display: flex;
              flex-direction: column;
              gap: 1rem;
              animation: ssn-theater-fade 0.8s ease both;
            }
            .ssn-theater-count {
              margin: 0;
              font-size: 0.68rem;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: hsl(var(--cat) 85% 70%);
            }
            .ssn-theater-head {
              display: flex;
              align-items: center;
              gap: 0.7rem;
              flex-wrap: wrap;
            }
            .ssn-theater-title {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 800;
              color: #fff;
            }
            .ssn-theater-detail {
              margin: 0;
              font-size: 1rem;
              line-height: 1.7;
              color: rgba(255, 255, 255, 0.78);
            }
            .ssn-theater-checkpoint {
              margin: 0;
              font-size: 0.85rem;
              color: rgba(255, 255, 255, 0.6);
            }
            .ssn-theater-done {
              align-self: flex-start;
              padding: 0.75rem 1.4rem;
              border-radius: 0.85rem;
              border: none;
              background: hsl(var(--cat) 80% 62%);
              color: #0d0a1f;
              font-size: 0.95rem;
              font-weight: 700;
              cursor: pointer;
            }
            .ssn-theater-exit {
              position: absolute;
              top: max(1rem, env(safe-area-inset-top));
              right: max(1rem, env(safe-area-inset-right));
              padding: 0.45rem 0.9rem;
              border-radius: 9999px;
              border: 1px solid rgba(255, 255, 255, 0.25);
              background: none;
              color: rgba(255, 255, 255, 0.6);
              font-size: 0.75rem;
              cursor: pointer;
            }
            @keyframes ssn-theater-fade {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: none; }
            }
            @media (prefers-reduced-motion: reduce) {
              .ssn-theater-entry,
              .ssn-theater-step {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      <style>{`
        .ssn-theater-open {
          padding: 0.55rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .ssn-theater-open:hover {
          border-color: hsla(var(--cat), 70%, 60%, 0.6);
        }
      `}</style>
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- TheaterMode` — expected: PASS.

- [ ] **Step 5: Make StepTracker rehydrate on theater writes**

In `StepTracker.tsx`, extend the existing event-listener effect (currently listens only for `nm-progress-applied`, lines 52–55):

```tsx
useEffect(() => {
  window.addEventListener('nm-progress-applied', rehydrate)
  window.addEventListener('nm-session-steps-changed', rehydrate)
  return () => {
    window.removeEventListener('nm-progress-applied', rehydrate)
    window.removeEventListener('nm-session-steps-changed', rehydrate)
  }
}, [rehydrate])
```

- [ ] **Step 6: Wire into the page**

In `app/sessions/[slug]/page.tsx`, import `TheaterMode` and pass it as SessionRunner's child:

```tsx
<SessionRunner
  slug={session.slug}
  hue={session.hue}
  durationLabel={session.durationLabel}
  timeline={session.timeline}
>
  <TheaterMode slug={session.slug} hue={session.hue} steps={session.steps} />
</SessionRunner>
```

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run type-check && npm run lint` — expected: all green (StepTracker tests must still pass).

```bash
git add components/sessions/TheaterMode.tsx components/sessions/TheaterMode.test.tsx components/sessions/StepTracker.tsx "app/sessions/[slug]/page.tsx"
git commit -m "FEAT: TheaterMode — fullscreen one-step focus mode with entry ritual + wake lock"
```

---

### Task 5: `CompletionRitual` — mood check-in + summary when all steps are done

**Files:**
- Create: `sites/nathamuni-com/components/sessions/CompletionRitual.tsx`
- Modify: `sites/nathamuni-com/app/sessions/[slug]/page.tsx`
- Test: `sites/nathamuni-com/components/sessions/CompletionRitual.test.tsx`

**Interfaces:**
- Consumes: `loadItem`, `saveItem` from `@/lib/progress`; `loadStartDate`, `dayOfSession` from `@/lib/sessionRun`. Reads `` `session-${slug}` `` boolean[]; listens for `nm-session-steps-changed` and `nm-progress-applied`.
- Produces: `CompletionRitual({ slug, stepCount })` — renders nothing until every step is checked; then a celebration card: "Protocol complete", days-taken line (only if a start date exists), five mood buttons (😖😕😐🙂🤩 values 1–5) writing `` `metrics-mood-${slug}` `` = JSON `[{ date: 'YYYY-MM-DD', mood: number }]` (append, one per day — same-day re-tap replaces), and after mood is logged a "Logged — see you tomorrow" confirmation. No share card in Phase 1.

- [ ] **Step 1: Write the failing tests**

Create `components/sessions/CompletionRitual.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CompletionRitual } from './CompletionRitual'
import { localIsoDate, saveStartDate } from '@/lib/sessionRun'

beforeEach(() => window.localStorage.clear())

function setSteps(done: boolean[]) {
  window.localStorage.setItem('session-test-session', JSON.stringify(done))
}

describe('CompletionRitual', () => {
  it('renders nothing while steps remain', () => {
    setSteps([true, false])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    expect(screen.queryByText(/protocol complete/i)).toBeNull()
  })

  it('appears when all steps are done', () => {
    setSteps([true, true])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    expect(screen.getByText(/protocol complete/i)).toBeTruthy()
  })

  it('appears live when the last step completes elsewhere', () => {
    setSteps([true, false])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    setSteps([true, true])
    act(() => {
      window.dispatchEvent(new Event('nm-session-steps-changed'))
    })
    expect(screen.getByText(/protocol complete/i)).toBeTruthy()
  })

  it('logs a mood for today, replacing a same-day entry', () => {
    setSteps([true])
    render(<CompletionRitual slug="test-session" stepCount={1} />)
    fireEvent.click(screen.getByRole('button', { name: /great/i }))
    fireEvent.click(screen.getByRole('button', { name: /okay/i }))
    const log = JSON.parse(window.localStorage.getItem('metrics-mood-test-session') ?? '[]')
    expect(log).toEqual([{ date: localIsoDate(), mood: 3 }])
    expect(screen.getByText(/logged/i)).toBeTruthy()
  })

  it('shows days taken when a start date exists', () => {
    saveStartDate('test-session', localIsoDate())
    setSteps([true])
    render(<CompletionRitual slug="test-session" stepCount={1} />)
    expect(screen.getByText(/day 1/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- CompletionRitual` — expected: FAIL, module not found.

- [ ] **Step 3: Implement `CompletionRitual.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadItem, saveItem } from '@/lib/progress'
import { dayOfSession, loadStartDate, localIsoDate } from '@/lib/sessionRun'

const MOODS = [
  { value: 1, emoji: '😖', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
] as const

interface MoodEntry {
  date: string
  mood: number
}

function moodKey(slug: string): string {
  return `metrics-mood-${slug}`
}

function loadMoods(slug: string): MoodEntry[] {
  try {
    const raw = loadItem(moodKey(slug))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e): e is MoodEntry =>
          Boolean(e) && typeof (e as MoodEntry).date === 'string' && typeof (e as MoodEntry).mood === 'number'
      )
    }
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  return []
}

function allStepsDone(slug: string, stepCount: number): boolean {
  try {
    const raw = loadItem(`session-${slug}`)
    if (!raw) return false
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return false
    for (let i = 0; i < stepCount; i++) {
      if (!parsed[i]) return false
    }
    return stepCount > 0
  } catch {
    return false
  }
}

/**
 * The reward step of the habit loop: appears only once every protocol step
 * is checked. Days-taken line + a one-tap mood check-in stored under the
 * synced `metrics-` prefix (Calm-style: the check-in itself predicts
 * next-week return). Hidden on SSR/first paint; state loads after mount.
 */
export function CompletionRitual({ slug, stepCount }: { slug: string; stepCount: number }) {
  const [done, setDone] = useState(false)
  const [todayMood, setTodayMood] = useState<number | null>(null)
  const [day, setDay] = useState<number | null>(null)

  const rehydrate = useCallback(() => {
    setDone(allStepsDone(slug, stepCount))
    const started = loadStartDate(slug)
    setDay(started ? dayOfSession(started) : null)
    const today = localIsoDate()
    setTodayMood(loadMoods(slug).find((e) => e.date === today)?.mood ?? null)
  }, [slug, stepCount])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    rehydrate()
    window.addEventListener('nm-session-steps-changed', rehydrate)
    window.addEventListener('nm-progress-applied', rehydrate)
    return () => {
      window.removeEventListener('nm-session-steps-changed', rehydrate)
      window.removeEventListener('nm-progress-applied', rehydrate)
    }
  }, [rehydrate])

  function logMood(value: number) {
    const today = localIsoDate()
    const rest = loadMoods(slug).filter((e) => e.date !== today)
    saveItem(moodKey(slug), JSON.stringify([...rest, { date: today, mood: value }]))
    setTodayMood(value)
  }

  if (!done) return null

  return (
    <section className="ssn-complete" data-testid="completion-ritual" aria-live="polite">
      <p className="ssn-complete-title">🏁 Protocol complete</p>
      {day !== null && <p className="ssn-complete-days tabular-nums">Finished on day {day} of your run.</p>}
      <p className="ssn-complete-ask">How do you feel?</p>
      <div className="ssn-complete-moods" role="group" aria-label="How do you feel?">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`ssn-complete-mood${todayMood === m.value ? ' ssn-complete-mood-active' : ''}`}
            aria-label={m.label}
            title={m.label}
            onClick={() => logMood(m.value)}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {todayMood !== null && <p className="ssn-complete-logged">Logged — see you tomorrow.</p>}
      <style>{`
        .ssn-complete {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.3rem 1.4rem;
          border-radius: 1rem;
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.45);
          background: hsla(var(--cat), 70%, 55%, 0.1);
        }
        .ssn-complete-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
        }
        .ssn-complete-days,
        .ssn-complete-ask {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .ssn-complete-moods {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ssn-complete-mood {
          font-size: 1.3rem;
          line-height: 1;
          padding: 0.5rem 0.65rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.15s ease;
        }
        .ssn-complete-mood:hover {
          transform: scale(1.08);
        }
        .ssn-complete-mood-active {
          border-color: hsl(var(--cat) 80% 65%);
          background: hsla(var(--cat), 70%, 55%, 0.2);
        }
        .ssn-complete-logged {
          margin: 0;
          font-size: 0.78rem;
          color: hsl(var(--cat) 85% 72%);
        }
        @media (prefers-reduced-motion: reduce) {
          .ssn-complete-mood:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- CompletionRitual` — expected: PASS.

- [ ] **Step 5: Wire into the page**

In `app/sessions/[slug]/page.tsx`, import `CompletionRitual` and render it directly after the protocol block (after the closing `</div>` of `.ssn-session-protocol`):

```tsx
<CompletionRitual slug={session.slug} stepCount={session.steps.length} />
```

- [ ] **Step 6: Verify and commit**

Run: `npm test && npm run type-check && npm run lint` — expected: all green.

```bash
git add components/sessions/CompletionRitual.tsx components/sessions/CompletionRitual.test.tsx "app/sessions/[slug]/page.tsx"
git commit -m "FEAT: CompletionRitual — mood check-in + summary when a protocol completes"
```

---

### Task 6: Full verification + PR

- [ ] **Step 1: Full local gate**

Run from `sites/nathamuni-com/`: `npm test && npm run lint && npm run type-check && npm run build`
Expected: all green; build produces static `out/` with the 4 session pages.

- [ ] **Step 2: Manual smoke (dev server)**

Run `npm run dev`, open `http://localhost:3000/sessions/the-7-day-reset` and verify, at mobile width first (390px):
1. First paint shows "Start this session"; no hydration warnings in the console.
2. Start → "Day 1 · Kill switch + one action" chip; timeline "Day 1" phase highlighted with a Now chip.
3. Focus mode → 4s "Settle in" → step 1; "Done — next step" advances; Exit restores scroll; the page checklist shows the check made in theater.
4. Check every step → completion card appears; tapping a mood logs it and re-tapping another mood replaces today's entry.
5. Reload: start date, checks, and mood all survive.
6. OS "reduce motion" on: no entry/step fade animation.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin feat/v26-session-theater
gh pr create --title "FEAT: v26 Session Theater phase 1 — runnable sessions" --body "$(cat <<'EOF'
## Summary
- Sessions become runnable: Start button stores a start date (synced session- prefix) and the timeline shows live "Day N · Phase" positioning
- Focus mode: fullscreen one-step-at-a-time overlay with a 4s entry ritual, screen wake-lock, ambient hue glow (static gradient — not a sky revival), Escape/Exit to leave
- Completion ritual: mood check-in (metrics- prefix, syncs for signed-in users) + days-taken summary when every step is checked

## Test plan
- [ ] npm test / lint / type-check / build green in CI
- [ ] Manual smoke on /sessions/the-7-day-reset per plan Task 6 Step 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: After CI is green and PR merged, verify live**

Open `https://nathamuni.com/sessions/the-7-day-reset` on a real phone; repeat smoke checks 1–4.
