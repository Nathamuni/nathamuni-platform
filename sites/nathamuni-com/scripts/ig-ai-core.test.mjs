import { describe, it, expect } from 'vitest'
import { accountContext, renderIdeas, renderRating, renderIdeaTeaser, ideasPrompt } from './ig-ai-core.mjs'
import { rateIdea } from '../worker/telegram.mjs'

const videos = [
  { title: 'Big one', instagramUrl: 'https://www.instagram.com/reel/AAA/', publishedDate: '2026-11-07', category: 'Calisthenics & Fitness', views: 123000, reach: 98000, shares: 2000, avgWatchTimeMs: 28000 },
  { title: 'Small one', instagramUrl: 'https://www.instagram.com/reel/BBB/', publishedDate: '2026-11-10', category: 'AI & Builds', views: 900, reach: 700, shares: 1, avgWatchTimeMs: 5000 },
]
const transcripts = { AAA: { status: 'ok', hook: 'Priya sweety ku', english: 'A push-up challenge for Priya' } }
const idea = {
  title: 'One-arm push-up challenge',
  category: 'Calisthenics & Fitness',
  why: 'Your 123k reel was a challenge',
  hook_tanglish: 'Unnala idhu mudiyuma?',
  hook_english: 'Can you do this?',
  beats: ['dare', 'attempt', 'win'],
  caption: 'Mudiyuma? / Can you? Tag a friend',
  hashtags: ['#calisthenics', 'tamilfitness'],
}

describe('accountContext', () => {
  it('includes real stats and transcript hooks, and lists weak reels', () => {
    const c = accountContext(videos, transcripts, [{ date: '2026-11-21', followers: 12595 }], '2026-11-22')
    expect(c).toContain('Big one')
    expect(c).toContain('Priya sweety ku')
    expect(c).toContain('12595')
    expect(c).toContain('WEAKEST')
    expect(ideasPrompt(c, '2026-11-22')).toContain('5 NEW reel ideas')
  })
})

describe('renderers', () => {
  it('renders an ideas pack and strips duplicate # signs', () => {
    const text = renderIdeas({ date: '2026-11-23', ideas: [idea] })
    expect(text).toContain('One-arm push-up challenge')
    expect(text).toContain('#calisthenics #tamilfitness')
    expect(text).not.toContain('##')
  })
  it('handles a missing pack', () => {
    expect(renderIdeas(null)).toContain('No ideas yet')
    expect(renderIdeaTeaser(null)).toBeNull()
  })
  it('renders a rating with clamped stars and escaped idea text', () => {
    const text = renderRating({ score: 14, verdict: 'Strong', why: 'w', better_angle: 'b', hook_tanglish: 'h', hook_english: 'e', caption: 'c' }, '<gym> idea')
    expect(text).toContain('★★★★★★★★★★')
    expect(text).toContain('&lt;gym&gt;')
  })
})

describe('rateIdea', () => {
  const kv = (initial = {}) => {
    const m = new Map(Object.entries(initial))
    return { get: async (k) => m.get(k) ?? null, put: async (k, v) => m.set(k, v), delete: async (k) => m.delete(k) }
  }
  it('asks for the idea text when empty', async () => {
    expect(await rateIdea({ INBOX: kv() }, '')).toContain('Send your idea')
  })
  it('refuses once the daily cap is reached, without calling Gemini', async () => {
    const { istToday } = await import('./ig-report-core.mjs')
    const env = { GEMINI_API_KEY: 'x', INBOX: kv({ [`tg:ai:${istToday()}`]: '10' }) }
    expect(await rateIdea(env, 'gym fail funny')).toContain('Daily AI limit reached')
  })
})
