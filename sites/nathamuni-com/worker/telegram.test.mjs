import { describe, it, expect } from 'vitest'
import { replyFor, handleTelegram, scheduledMessage, CRON_EVENING, CRON_WEEKLY } from './telegram.mjs'

const TODAY = '2026-11-22'
const v = (o) => ({
  title: 'A reel',
  instagramUrl: 'https://www.instagram.com/reel/ABC123/',
  publishedDate: '2026-11-10',
  category: 'Calisthenics & Fitness',
  mediaType: 'reel',
  views: 9000,
  reach: 6000,
  shares: 60,
  avgWatchTimeMs: 12000,
  ...o,
})
const data = {
  videos: [v({}), v({ instagramUrl: 'https://www.instagram.com/reel/XYZ/', title: 'Other', views: 3000 })],
  insights: { followersCount: 12000 },
  history: [
    { date: '2026-11-01', followers: 10000 },
    { date: '2026-11-21', followers: 12000 },
  ],
  transcripts: { ABC123: { status: 'ok', hook: 'Vanakkam makkale', text: 'Vanakkam makkale, inniki...' } },
}

describe('replyFor', () => {
  it('answers plain questions with a next-post suggestion', () => {
    expect(replyFor('what should I post next?', data, TODAY)).toContain('Post next')
  })
  it('routes commands, including the @botname suffix', () => {
    expect(replyFor('/best@nathamuni_insta_bot', data, TODAY)).toContain('Top 5')
    expect(replyFor('/goal', data, TODAY)).toContain('Road to 50k')
    expect(replyFor('/when', data, TODAY)).toContain('6–9 pm')
    expect(replyFor('/boost', data, TODAY)).toContain('Boost')
    expect(replyFor('/start', data, TODAY)).toContain('/next')
  })
  it('shows a reel with its transcript hook, by command or pasted link', () => {
    expect(replyFor('/reel https://www.instagram.com/reel/ABC123/', data, TODAY)).toContain('Vanakkam makkale')
    expect(replyFor('https://www.instagram.com/reel/ABC123/?igsh=x', data, TODAY)).toContain('Vanakkam makkale')
  })
  it('explains usage for an unknown reel and an unknown command', () => {
    expect(replyFor('/reel nope', data, TODAY)).toContain('Send /reel')
    expect(replyFor('/dance', data, TODAY)).toContain('Unknown command')
  })
  it('survives empty data', () => {
    const empty = { videos: [], insights: null, history: [], transcripts: {} }
    for (const m of ['/today', '/best', '/goal', '/boost', '/next', 'hi']) {
      expect(() => replyFor(m, empty, TODAY)).not.toThrow()
    }
  })
})

describe('handleTelegram', () => {
  it('rejects requests without the webhook secret', async () => {
    const req = new Request('https://x/api/telegram', { method: 'POST', body: '{}' })
    const res = await handleTelegram(req, { TELEGRAM_WEBHOOK_SECRET: 's3cret' })
    expect(res.status).toBe(403)
  })
  it('rejects everything when no secret is configured', async () => {
    const req = new Request('https://x/api/telegram', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': '' },
      body: '{}',
    })
    expect((await handleTelegram(req, {})).status).toBe(403)
  })
})

describe('scheduledMessage', () => {
  it('sends the evening nudge when nothing was posted today', () => {
    expect(scheduledMessage(CRON_EVENING, data, TODAY)).toContain('Posting window opens at 6 pm')
  })
  it('skips the evening nudge when a post already went out today', () => {
    const posted = { ...data, videos: [...data.videos, v({ publishedDate: TODAY, instagramUrl: 'https://www.instagram.com/reel/NEW/' })] }
    expect(scheduledMessage(CRON_EVENING, posted, TODAY)).toBeNull()
  })
  it('builds the Sunday review with follower gain and the mix', () => {
    const text = scheduledMessage(CRON_WEEKLY, data, TODAY)
    expect(text).toContain('Weekly review')
    expect(text).toContain('Mix this week')
  })
  it('ignores unknown crons', () => {
    expect(scheduledMessage('0 0 * * *', data, TODAY)).toBeNull()
  })
  it('/week replies with the review on demand', () => {
    expect(replyFor('/week', data, TODAY)).toContain('Weekly review')
  })
})

describe('dispatchSync', () => {
  it('does nothing without a token', async () => {
    const { dispatchSync } = await import('./telegram.mjs')
    await expect(dispatchSync({})).resolves.toBeUndefined()
  })
  it('calls the GitHub dispatch API for instagram-sync.yml on main', async () => {
    const { dispatchSync } = await import('./telegram.mjs')
    const calls = []
    const orig = globalThis.fetch
    globalThis.fetch = async (url, init) => (calls.push({ url, init }), new Response(null, { status: 204 }))
    try {
      await dispatchSync({ GH_DISPATCH_TOKEN: 't' })
    } finally {
      globalThis.fetch = orig
    }
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('/actions/workflows/instagram-sync.yml/dispatches')
    expect(JSON.parse(calls[0].init.body)).toEqual({ ref: 'main' })
  })
})
