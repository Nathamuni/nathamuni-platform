import { describe, it, expect } from 'vitest'
import { buildReport, renderTelegram, median, istToday, escapeHtml } from './ig-report-core.mjs'

const TODAY = '2026-11-22'
const day = (n) => new Date(Date.parse(TODAY) - n * 86400000).toISOString().slice(0, 10)

// 10 settled baseline posts: views 5000, reach 4000, watch 10s
const baseline = Array.from({ length: 10 }, (_, i) => ({
  title: `base ${i}`,
  publishedDate: day(10 + i),
  mediaType: 'reel',
  category: 'Life & Moments',
  views: 5000,
  reach: 4000,
  shares: 16,
  avgWatchTimeMs: 10000,
  instagramUrl: 'https://instagram.com/x',
}))
const history = [
  { date: day(8), followers: 1000 },
  { date: day(2), followers: 1100 },
  { date: day(1), followers: 1150 },
]
const run = (extra = [], opts = {}) =>
  buildReport({ videos: [...baseline, ...extra], insights: null, history, today: TODAY, ...opts })

describe('median', () => {
  it('handles odd, even, empty and non-finite input', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBeNull()
    expect(median([null, undefined, 4])).toBe(4)
  })
})

describe('buildReport', () => {
  it('computes follower deltas from history', () => {
    const r = run()
    expect(r.followers.now).toBe(1150)
    expect(r.followers.d1).toBe(50)
    expect(r.followers.d7).toBe(150)
  })

  it('flags a fresh 15k+ post for a Part 2', () => {
    const r = run([{ ...baseline[0], title: 'viral', publishedDate: day(1), views: 20000, reach: 3000 }])
    expect(r.alerts.map((a) => a.kind)).toContain('part2')
  })

  it('does not flag an old 15k+ post for a Part 2', () => {
    const r = run([{ ...baseline[0], title: 'old', publishedDate: day(5), views: 20000 }])
    expect(r.alerts.map((a) => a.kind)).not.toContain('part2')
  })

  it('flags a boost when early reach is ≥2.5× the median', () => {
    const r = run([{ ...baseline[0], title: 'hot', publishedDate: day(1), views: 9000, reach: 10000 }])
    const boost = r.alerts.find((a) => a.kind === 'boost')
    expect(boost?.post.title).toBe('hot')
  })

  it('flags a hook change after 3 weak settled reels', () => {
    const weak = [2, 3, 4].map((n) => ({ ...baseline[0], title: `weak${n}`, publishedDate: day(n), views: 3000 }))
    expect(run(weak).alerts.map((a) => a.kind)).toContain('hook')
  })

  it('does not count unsettled reels toward the hook rule', () => {
    const weak = [0, 1, 2].map((n) => ({ ...baseline[0], title: `new${n}`, publishedDate: day(n), views: 100 }))
    expect(run(weak).alerts.map((a) => a.kind)).not.toContain('hook')
  })

  it('flags a posting gap and picks the most under-served category', () => {
    const r = run()
    expect(r.alerts.find((a) => a.kind === 'gap')?.text).toMatch(/10 days/)
    expect(r.pick.cat).toBe('Calisthenics & Fitness')
  })

  it('survives empty data without throwing', () => {
    const r = buildReport({ videos: [], insights: null, history: [], today: TODAY })
    expect(r.alerts).toEqual([])
    expect(r.top).toBeNull()
    expect(() => renderTelegram(r)).not.toThrow()
  })
})

describe('renderTelegram', () => {
  it('escapes HTML in titles and stays under the Telegram limit', () => {
    const r = run([{ ...baseline[0], title: '<b>x</b> & y', publishedDate: day(1), views: 20000 }])
    const text = renderTelegram(r)
    expect(text).toContain('&lt;b&gt;x&lt;/b&gt; &amp; y')
    expect(text.length).toBeLessThan(4096)
  })
  it('escapeHtml leaves plain text alone', () => {
    expect(escapeHtml('hello')).toBe('hello')
  })
})

describe('istToday', () => {
  it('rolls over at IST midnight, not UTC', () => {
    expect(istToday(new Date('2026-11-21T18:31:00Z'))).toBe('2026-11-22')
    expect(istToday(new Date('2026-11-21T18:29:00Z'))).toBe('2026-11-21')
  })
})
