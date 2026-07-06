import { describe, expect, it } from 'vitest'
import {
  getAllVideos,
  getFeaturedVideos,
  getVideoBySlug,
  getAllCategories,
  searchAndFilterVideos,
} from './videos'

describe('videos data accessors', () => {
  it('returns all 6 videos', () => {
    expect(getAllVideos()).toHaveLength(6)
  })

  it('returns only featured videos', () => {
    const featured = getFeaturedVideos()
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.every((video) => video.featured)).toBe(true)
  })

  it('finds a video by its slug', () => {
    const video = getVideoBySlug('roast-of-dms')
    expect(video?.title).toBe('The Roast Of My DMs')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getVideoBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns deduplicated, sorted categories', () => {
    const categories = getAllCategories()
    expect(categories).toEqual([...categories].sort())
    expect(new Set(categories).size).toBe(categories.length)
  })
})

describe('searchAndFilterVideos', () => {
  const videos = getAllVideos()

  it('returns all videos when query and category are empty', () => {
    expect(searchAndFilterVideos(videos, '', null)).toHaveLength(videos.length)
  })

  it('matches by title, case-insensitively', () => {
    const results = searchAndFilterVideos(videos, 'ROAST', null)
    expect(results.map((v) => v.id)).toContain('roast-of-dms')
  })

  it('matches by tag', () => {
    const results = searchAndFilterVideos(videos, 'calisthenics', null)
    expect(results.map((v) => v.id)).toContain('poor-lighting-workout')
  })

  it('filters by category', () => {
    const results = searchAndFilterVideos(videos, '', 'Fitness')
    expect(results.every((v) => v.category === 'Fitness')).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('combines query and category filters', () => {
    const results = searchAndFilterVideos(videos, 'workout', 'Fitness')
    expect(results.every((v) => v.category === 'Fitness')).toBe(true)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchAndFilterVideos(videos, 'zzzznomatch', null)).toEqual([])
  })
})
