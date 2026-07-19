import { describe, it, expect } from 'vitest'
import { buildDashboard } from './insights-dashboard'
import type { Video } from './videos'

const V = (over: Partial<Video>): Video => ({
  id: over.id ?? 'x',
  title: 'X',
  instagramUrl: '',
  thumbnail: null,
  category: over.category ?? 'Life & Moments',
  tags: over.tags ?? [],
  shortDescription: '',
  detailedDescription: '',
  featured: false,
  publishedDate: over.publishedDate ?? '2026-07-01',
  ...over,
})

describe('buildDashboard', () => {
  const videos: Video[] = [
    V({ id: 'a', category: 'Humor & Tamil', mediaType: 'reel', tags: ['tamil'], likeCount: 300, commentsCount: 10, publishedDate: '2026-07-05' }),
    V({ id: 'b', category: 'Humor & Tamil', mediaType: 'post', tags: ['tamil'], likeCount: 100, commentsCount: 2, publishedDate: '2026-07-06' }),
    V({ id: 'c', category: 'AI & Builds', mediaType: 'reel', tags: ['ai'], likeCount: 20, commentsCount: 1, publishedDate: '2026-06-01' }),
  ]
  const insights = { followersCount: 1000, reachLast30Days: 5000, profileViewsLast30Days: 400 }
  const history = [
    { date: '2026-07-18', followers: 990, reach30: 4800 },
    { date: '2026-07-19', followers: 1000, reach30: 5000 },
  ]

  it('aggregates categories with real share and counts', () => {
    const d = buildDashboard(videos, insights, history)
    const humor = d.categories.find((c) => c.category === 'Humor & Tamil')!
    expect(humor.posts).toBe(2)
    expect(Math.round(humor.share)).toBe(67)
  })

  it('splits reels vs photo posts', () => {
    const d = buildDashboard(videos, insights, history)
    expect(d.reels).toBe(2)
    expect(d.photoPosts).toBe(1)
  })

  it('produces 7 weekday, 12 month, and 6 distribution buckets', () => {
    const d = buildDashboard(videos, insights, history)
    expect(d.weekday).toHaveLength(7)
    expect(d.months).toHaveLength(12)
    expect(d.distribution).toHaveLength(6)
  })

  it('passes through the growth history', () => {
    const d = buildDashboard(videos, insights, history)
    expect(d.growth).toHaveLength(2)
    expect(d.growth[1].followers).toBe(1000)
  })

  it('reports hasReach false until per-post reach is synced', () => {
    expect(buildDashboard(videos, insights, history).hasReach).toBe(false)
    expect(buildDashboard([V({ reach: 500 })], insights, history).hasReach).toBe(true)
  })
})
