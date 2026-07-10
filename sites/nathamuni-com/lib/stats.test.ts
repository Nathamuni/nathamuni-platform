import { describe, expect, it } from 'vitest'
import type { Video } from './videos'
import type { Story } from './stories'
import {
  computeTotals,
  computeCategoryShares,
  computeTimeline,
  computeStreak,
  computeTopTags,
  computeFeaturedCount,
  computeTopEngagement,
  buildStats,
  getStats,
} from './stats'

function video(overrides: Partial<Video>): Video {
  return {
    id: overrides.id ?? 'vid',
    title: 'Title',
    instagramUrl: 'https://www.instagram.com/reel/abc/',
    thumbnail: '/images/thumbnails/abc.jpg',
    category: 'Life & Moments',
    tags: [],
    shortDescription: 'short',
    detailedDescription: 'detailed',
    featured: false,
    publishedDate: '2026-01-01',
    ...overrides,
  }
}

function story(overrides: Partial<Story>): Story {
  return {
    id: 's1',
    date: '2026-01-01',
    video: '/stories/s1.mp4',
    poster: '/stories/s1.jpg',
    title: null,
    ...overrides,
  }
}

describe('computeTotals', () => {
  it('sums videos into reels vs posts and counts stories/categories', () => {
    const videos = [
      video({ id: 'a', mediaType: 'reel', category: 'Mind & Discipline' }),
      video({ id: 'b', mediaType: 'post', category: 'Mind & Discipline' }),
      video({ id: 'c', category: 'AI & Builds' }), // no mediaType -> reel
    ]
    const stories = [story({ id: 's1' }), story({ id: 's2' })]
    const totals = computeTotals(videos, stories)
    expect(totals.videos).toBe(3)
    expect(totals.reels).toBe(2)
    expect(totals.posts).toBe(1)
    expect(totals.reels + totals.posts).toBe(totals.videos)
    expect(totals.stories).toBe(2)
    expect(totals.categories).toBe(2)
  })
})

describe('computeCategoryShares', () => {
  it('shares sum to ~100 and counts sum to the total', () => {
    const videos = [
      video({ id: 'a', category: 'Mind & Discipline' }),
      video({ id: 'b', category: 'Mind & Discipline' }),
      video({ id: 'c', category: 'AI & Builds' }),
    ]
    const shares = computeCategoryShares(videos)
    const totalShare = shares.reduce((sum, s) => sum + s.share, 0)
    const totalCount = shares.reduce((sum, s) => sum + s.count, 0)
    expect(totalShare).toBeCloseTo(100, 5)
    expect(totalCount).toBe(videos.length)
  })

  it('returns an empty array for an empty library', () => {
    expect(computeCategoryShares([])).toEqual([])
  })
})

describe('computeTimeline', () => {
  it('returns 12 months ordered oldest to newest, ending at "now"', () => {
    const now = new Date('2026-07-15T00:00:00Z')
    const timeline = computeTimeline([], 12, now)
    expect(timeline).toHaveLength(12)
    expect(timeline[11].label).toBe('Jul 2026')
    expect(timeline[0].label).toBe('Aug 2025')
  })

  it('buckets videos by publish month within the window', () => {
    const now = new Date('2026-07-15T00:00:00Z')
    const videos = [
      video({ id: 'a', publishedDate: '2026-07-01' }),
      video({ id: 'b', publishedDate: '2026-07-10' }),
      video({ id: 'c', publishedDate: '2026-06-05' }),
    ]
    const timeline = computeTimeline(videos, 12, now)
    const july = timeline.find((t) => t.label === 'Jul 2026')
    const june = timeline.find((t) => t.label === 'Jun 2026')
    expect(july?.count).toBe(2)
    expect(june?.count).toBe(1)
  })

  it('ignores videos published outside the window', () => {
    const now = new Date('2026-07-15T00:00:00Z')
    const videos = [video({ id: 'old', publishedDate: '2020-01-01' })]
    const timeline = computeTimeline(videos, 12, now)
    const total = timeline.reduce((sum, t) => sum + t.count, 0)
    expect(total).toBe(0)
  })
})

describe('computeStreak', () => {
  it('finds the longest run of consecutive posting days', () => {
    const videos = [
      video({ id: 'a', publishedDate: '2026-01-01' }),
      video({ id: 'b', publishedDate: '2026-01-02' }),
      video({ id: 'c', publishedDate: '2026-01-03' }),
      video({ id: 'd', publishedDate: '2026-01-10' }),
    ]
    const streak = computeStreak(videos)
    expect(streak.longestStreakDays).toBe(3)
    expect(streak.currentCadenceDays).not.toBeNull()
  })

  it('returns null cadence and a 1-day streak with fewer than 2 unique dates', () => {
    const streak = computeStreak([video({ id: 'a', publishedDate: '2026-01-01' })])
    expect(streak.longestStreakDays).toBe(1)
    expect(streak.currentCadenceDays).toBeNull()
  })

  it('handles an empty library', () => {
    const streak = computeStreak([])
    expect(streak.longestStreakDays).toBe(0)
    expect(streak.currentCadenceDays).toBeNull()
  })
})

describe('computeTopTags', () => {
  it('sorts tags by frequency descending', () => {
    const videos = [
      video({ id: 'a', tags: ['ai', 'builds'] }),
      video({ id: 'b', tags: ['ai'] }),
      video({ id: 'c', tags: ['ai', 'discipline'] }),
      video({ id: 'd', tags: ['builds'] }),
    ]
    const tags = computeTopTags(videos, 10)
    expect(tags[0]).toEqual({ tag: 'ai', count: 3 })
    const counts = tags.map((t) => t.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('caps results at the requested limit', () => {
    const videos = [video({ id: 'a', tags: ['x1', 'x2', 'x3'] })]
    expect(computeTopTags(videos, 2)).toHaveLength(2)
  })
})

describe('computeFeaturedCount', () => {
  it('counts only featured videos', () => {
    const videos = [
      video({ id: 'a', featured: true }),
      video({ id: 'b', featured: false }),
      video({ id: 'c', featured: true }),
    ]
    expect(computeFeaturedCount(videos)).toBe(2)
  })
})

describe('computeTopEngagement', () => {
  it('is empty with no like/comment data on any video', () => {
    const videos = [video({ id: 'a' }), video({ id: 'b' })]
    const result = computeTopEngagement(videos)
    expect(result.hasEngagementData).toBe(false)
    expect(result.topLiked).toEqual([])
    expect(result.topCommented).toEqual([])
  })

  it('ranks videos by likeCount and commentsCount once present', () => {
    const videos = [
      video({ id: 'a', title: 'A', likeCount: 10, commentsCount: 5 }),
      video({ id: 'b', title: 'B', likeCount: 50, commentsCount: 1 }),
      video({ id: 'c', title: 'C', likeCount: 5, commentsCount: 20 }),
    ]
    const result = computeTopEngagement(videos, 2)
    expect(result.hasEngagementData).toBe(true)
    expect(result.topLiked.map((v) => v.id)).toEqual(['b', 'a'])
    expect(result.topCommented.map((v) => v.id)).toEqual(['c', 'a'])
  })
})

describe('buildStats', () => {
  it('combines all pieces into one bundle', () => {
    const videos = [video({ id: 'a' }), video({ id: 'b', category: 'AI & Builds' })]
    const stories = [story({ id: 's1' })]
    const stats = buildStats(videos, stories)
    expect(stats.totals.videos).toBe(2)
    expect(stats.categoryShares.length).toBe(2)
    expect(stats.timeline).toHaveLength(12)
    expect(stats.hasEngagementData).toBe(false)
  })
})

describe('getStats (real site data)', () => {
  it('computes a consistent bundle from the actual library', () => {
    const stats = getStats()
    expect(stats.totals.videos).toBeGreaterThan(0)
    expect(stats.totals.reels + stats.totals.posts).toBe(stats.totals.videos)
    const totalShare = stats.categoryShares.reduce((sum, s) => sum + s.share, 0)
    expect(totalShare).toBeCloseTo(100, 5)
    expect(stats.timeline).toHaveLength(12)
  })
})
