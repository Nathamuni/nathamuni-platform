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
