import { describe, expect, it } from 'vitest'
import { getAllStories } from './stories'

describe('stories', () => {
  it('returns the archived stories, newest first', () => {
    const stories = getAllStories()
    expect(stories.length).toBeGreaterThanOrEqual(41)
    const dates = stories.map((s) => s.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('every story has a self-hosted video and poster', () => {
    for (const s of getAllStories()) {
      expect(s.video).toMatch(/^\/stories\/.+\.mp4$/)
      expect(s.poster).toMatch(/^\/stories\/.+\.jpg$/)
    }
  })
})
