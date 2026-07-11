import { describe, expect, it, vi } from 'vitest'
import { getFeed, getFeedPage } from './feed'
import { getAllVideos } from './videos'
import { getAllStories } from './stories'
import { getAllPosts } from './blog'

vi.mock('./stories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./stories')>()
  return {
    ...actual,
    getAllStories: () => [
      ...actual.getAllStories(),
      { id: 'test-null-poster-story', date: '2020-01-01', video: '/stories/test.mp4', poster: null, title: null },
    ],
  }
})

describe('feed', () => {
  it('merges every video, story, and post into one feed', () => {
    const feed = getFeed()
    const expectedCount = getAllVideos().length + getAllStories().length + getAllPosts().length
    expect(feed.length).toBe(expectedCount)
  })

  it('sorts newest first with dates strictly non-increasing', () => {
    const feed = getFeed()
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i].date <= feed[i - 1].date).toBe(true)
    }
  })

  it('maps each source to the correct kind', () => {
    const feed = getFeed()
    const postVideoIds = new Set(
      getAllVideos().filter((v) => v.mediaType === 'post').map((v) => v.id)
    )
    const reelVideoIds = new Set(
      getAllVideos().filter((v) => v.mediaType !== 'post').map((v) => v.id)
    )
    const storyIds = new Set(getAllStories().map((s) => s.id))
    const postSlugs = new Set(getAllPosts().map((p) => p.slug))

    expect(feed.length).toBeGreaterThan(0)
    for (const entry of feed) {
      if (postVideoIds.has(entry.id)) expect(entry.kind).toBe('post')
      else if (reelVideoIds.has(entry.id)) expect(entry.kind).toBe('reel')
      else if (storyIds.has(entry.id)) expect(entry.kind).toBe('story')
      else if (postSlugs.has(entry.id)) expect(entry.kind).toBe('blog')
      else throw new Error(`unmatched feed entry id: ${entry.id}`)
    }
  })

  it('builds well-formed hrefs per kind', () => {
    for (const entry of getFeed()) {
      if (entry.kind === 'reel' || entry.kind === 'post') {
        expect(entry.href).toBe(`/videos/${entry.id}`)
      } else if (entry.kind === 'story') {
        expect(entry.href).toBe('/moments')
      } else {
        expect(entry.href).toBe(`/blog/${entry.id}`)
      }
    }
  })

  it('keeps image null for stories with no poster', () => {
    const feed = getFeed()
    const entry = feed.find((e) => e.kind === 'story' && e.id === 'test-null-poster-story')
    expect(entry).toBeDefined()
    expect(entry?.image).toBeNull()
  })

  it('getFeedPage returns the first N entries of the full feed', () => {
    const page = getFeedPage(10)
    expect(page.length).toBe(10)
    expect(page).toEqual(getFeed().slice(0, 10))
  })
})
