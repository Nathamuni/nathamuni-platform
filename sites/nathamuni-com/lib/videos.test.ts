import { describe, expect, it } from 'vitest'
import {
  getAllVideos,
  getFeaturedVideos,
  getVideoBySlug,
  getAllCategories,
  getCategoryCounts,
  searchAndFilterVideos,
} from './videos'

describe('videos data accessors', () => {
  it('returns the full imported library', () => {
    expect(getAllVideos().length).toBeGreaterThanOrEqual(79)
  })

  it('sorts videos newest first', () => {
    const dates = getAllVideos().map((v) => v.publishedDate)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('returns only featured videos', () => {
    const featured = getFeaturedVideos()
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.every((video) => video.featured)).toBe(true)
  })

  it('finds a video by its slug', () => {
    const video = getVideoBySlug('the-roast-of-my-dms')
    expect(video?.title).toBe('The Roast Of My DMs')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getVideoBySlug('does-not-exist')).toBeUndefined()
  })

  it('has unique ids across the whole library', () => {
    const ids = getAllVideos().map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns deduplicated, sorted categories', () => {
    const categories = getAllCategories()
    expect(categories).toEqual([...categories].sort())
    expect(new Set(categories).size).toBe(categories.length)
  })

  it('returns per-category counts that sum to the library size', () => {
    const counts = getCategoryCounts()
    const total = counts.reduce((sum, c) => sum + c.count, 0)
    expect(total).toBe(getAllVideos().length)
    expect(counts.every((c) => c.count > 0)).toBe(true)
  })
})

describe('searchAndFilterVideos', () => {
  const videos = getAllVideos()

  it('returns all videos when query and category are empty', () => {
    expect(searchAndFilterVideos(videos, '', null)).toHaveLength(videos.length)
  })

  it('matches by title, case-insensitively', () => {
    const results = searchAndFilterVideos(videos, 'ROAST', null)
    expect(results.map((v) => v.id)).toContain('the-roast-of-my-dms')
  })

  it('matches by tag', () => {
    const results = searchAndFilterVideos(videos, 'calisthenics', null)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((v) => v.tags.includes('calisthenics'))).toBe(true)
  })

  it('matches inside the detailed description', () => {
    const target = videos.find((v) => v.detailedDescription.length > 80)!
    const phrase = target.detailedDescription.split(/\s+/).slice(0, 3).join(' ')
    const results = searchAndFilterVideos(videos, phrase, null)
    expect(results.map((v) => v.id)).toContain(target.id)
  })

  it('filters by category', () => {
    const results = searchAndFilterVideos(videos, '', 'Calisthenics & Fitness')
    expect(results.every((v) => v.category === 'Calisthenics & Fitness')).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('combines query and category filters', () => {
    const results = searchAndFilterVideos(videos, 'workout', 'Calisthenics & Fitness')
    expect(results.every((v) => v.category === 'Calisthenics & Fitness')).toBe(true)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchAndFilterVideos(videos, 'zzzznomatch', null)).toEqual([])
  })
})
