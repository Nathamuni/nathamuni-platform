import { describe, expect, it } from 'vitest'
import { currentStreakDays } from './streak'

const NOW = new Date('2026-07-16T12:00:00')

function daysAgo(n: number, hour = 9): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

describe('currentStreakDays', () => {
  it('is 0 with no entries', () => {
    expect(currentStreakDays([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(currentStreakDays([daysAgo(2), daysAgo(1), daysAgo(0)], NOW)).toBe(3)
  })

  it('still counts when today has no entry yet', () => {
    expect(currentStreakDays([daysAgo(2), daysAgo(1)], NOW)).toBe(2)
  })

  it('breaks on a missed day', () => {
    expect(currentStreakDays([daysAgo(3), daysAgo(2), daysAgo(0)], NOW)).toBe(1)
  })

  it('is 0 when the last entry is older than yesterday', () => {
    expect(currentStreakDays([daysAgo(5), daysAgo(4)], NOW)).toBe(0)
  })

  it('counts multiple same-day entries once', () => {
    expect(currentStreakDays([daysAgo(0, 8), daysAgo(0, 20), daysAgo(1)], NOW)).toBe(2)
  })

  it('ignores junk timestamps', () => {
    expect(currentStreakDays(['not-a-date', daysAgo(0)], NOW)).toBe(1)
  })
})
