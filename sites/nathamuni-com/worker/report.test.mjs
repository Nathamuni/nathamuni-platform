import { describe, it, expect } from 'vitest'
import { reportLink, verifyReport, bestPage, handleReport } from './report.mjs'

const env = { TELEGRAM_WEBHOOK_SECRET: 'sek' }
const v = (o) => ({ title: 'T', instagramUrl: 'https://www.instagram.com/reel/AAA/', publishedDate: '2026-11-10', views: 1000, reach: 800, saved: 40, shares: 20, avgWatchTimeMs: 7000, ...o })

describe('report links', () => {
  it('signs, verifies, and rejects tampering or expiry', async () => {
    const now = Date.UTC(2026, 10, 24)
    const link = await reportLink(env, 'best', now)
    const u = new URL(link)
    const [e, t] = [u.searchParams.get('e'), u.searchParams.get('t')]
    expect(await verifyReport(env, 'best', e, t, now)).toBe(true)
    expect(await verifyReport(env, 'today', e, t, now)).toBe(false)
    expect(await verifyReport(env, 'best', e, t.replace(/.$/, t.endsWith('0') ? '1' : '0'), now)).toBe(false)
    expect(await verifyReport(env, 'best', e, t, now + 2 * 3600 * 1000)).toBe(false)
    expect(await verifyReport({}, 'best', e, t, now)).toBe(false)
    expect(await reportLink({}, 'best')).toBe('')
  })
})

describe('bestPage', () => {
  it('shows the top 30-day reels with rates, escapes titles, and handles none', () => {
    const html = bestPage([v({ title: '<b>x</b>', views: 5000 }), v({ title: 'old', publishedDate: '2026-01-01', views: 99999 }), v({ title: 'mid', views: 2000 })], '2026-11-24')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('old')
    expect(html.indexOf('x&lt;/b&gt;')).toBeLessThan(html.indexOf('mid'))
    expect(html).toContain('5.0%') // saved 40/800
    expect(bestPage([], '2026-11-24')).toContain('No reels')
  })
})

describe('handleReport', () => {
  it('serves a valid link no-store/noindex and refuses a bad one', async () => {
    const link = await reportLink(env, 'best')
    const ok = await handleReport(new Request(link), env, async () => [v({})])
    expect(ok.status).toBe(200)
    expect(ok.headers.get('x-robots-tag')).toContain('noindex')
    expect(ok.headers.get('cache-control')).toBe('no-store')
    const bad = await handleReport(new Request('https://nathamuni.com/report/best?e=1999999999&t=' + '0'.repeat(64)), env, async () => [])
    expect(bad.status).toBe(403)
  })
})
