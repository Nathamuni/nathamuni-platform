import { describe, it, expect } from 'vitest'
import { buildPulseGraph } from './pulse'
import type { Video } from './videos'

const V = (over: Partial<Video>): Video => ({
  id: over.id ?? 'x',
  title: over.title ?? 'X',
  instagramUrl: '',
  thumbnail: null,
  category: over.category ?? 'Life & Moments',
  tags: over.tags ?? [],
  shortDescription: '',
  detailedDescription: '',
  featured: false,
  publishedDate: over.publishedDate ?? '2026-01-01',
  ...over,
})

describe('buildPulseGraph', () => {
  const videos: Video[] = [
    V({ id: 'a', category: 'Humor & Tamil', tags: ['tamil', 'humor'], likeCount: 400, commentsCount: 10 }),
    V({ id: 'b', category: 'Humor & Tamil', tags: ['tamil', 'humor'], likeCount: 200, commentsCount: 5 }),
    V({ id: 'c', category: 'AI & Builds', tags: ['ai'], likeCount: 20, commentsCount: 1 }),
  ]
  const insights = { followersCount: 1000, reachLast30Days: 5000, onlineFollowersByHour: null }

  it('creates a category node per distinct category and a post node per video', () => {
    const g = buildPulseGraph(videos, insights)
    const cats = g.nodes.filter((n) => n.kind === 'category')
    const posts = g.nodes.filter((n) => n.kind === 'post')
    expect(cats.map((c) => c.label).sort()).toEqual(['AI & Builds', 'Humor & Tamil'])
    expect(posts).toHaveLength(3)
  })

  it('links each post to its category', () => {
    const g = buildPulseGraph(videos, insights)
    const edge = g.edges.find((e) => e.source === 'post:a' && e.target === 'cat:Humor & Tamil')
    expect(edge).toBeDefined()
  })

  it('computes engagement rate against real follower count', () => {
    const g = buildPulseGraph(videos, insights)
    const a = g.nodes.find((n) => n.id === 'post:a')
    // (400+10)/1000*100 = 41%
    expect(a?.er).toBeCloseTo(41, 5)
  })

  it('marks live true only when real insights are present', () => {
    expect(buildPulseGraph(videos, insights).stats.live).toBe(true)
    expect(
      buildPulseGraph(videos, { followersCount: 1000, reachLast30Days: null, onlineFollowersByHour: null })
        .stats.live
    ).toBe(false)
  })

  it('bigger engagement yields larger post weight', () => {
    const g = buildPulseGraph(videos, insights)
    const a = g.nodes.find((n) => n.id === 'post:a')!
    const c = g.nodes.find((n) => n.id === 'post:c')!
    expect(a.weight).toBeGreaterThan(c.weight)
  })
})
