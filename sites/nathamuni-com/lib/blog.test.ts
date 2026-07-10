import { describe, expect, it } from 'vitest'
import { getAllPosts, getPostBySlug, getReadingMinutes } from './blog'

describe('blog', () => {
  it('returns posts newest first with unique slugs', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThanOrEqual(6)
    const dates = posts.map((p) => p.publishedDate)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length)
  })

  it('finds a post by slug and has real, substantial body content', () => {
    const post = getPostBySlug('motivation-is-a-feeling-systems-are-infrastructure')
    expect(post?.title).toContain('Motivation Is a Feeling')
    expect(post!.body.length).toBeGreaterThan(400)
    const wordCount = post!.body.trim().split(/\s+/).length
    expect(wordCount).toBeGreaterThanOrEqual(900)
    expect(wordCount).toBeLessThanOrEqual(1400)
  })

  it('returns undefined for unknown slugs', () => {
    expect(getPostBySlug('nope')).toBeUndefined()
  })

  it('every post is a substantial 900-1400 word essay with a real category', () => {
    const validCategories = new Set([
      'Mind & Discipline',
      'Calisthenics & Fitness',
      'AI & Builds',
      'Humor & Tamil',
      'Life & Moments',
    ])
    for (const post of getAllPosts()) {
      const wordCount = post.body.trim().split(/\s+/).length
      expect(wordCount, `${post.slug} word count`).toBeGreaterThanOrEqual(900)
      expect(wordCount, `${post.slug} word count`).toBeLessThanOrEqual(1400)
      expect(validCategories.has(post.category), `${post.slug} category`).toBe(true)
    }
  })

  it('every post carries at least one verifiable, real-URL reference', () => {
    for (const post of getAllPosts()) {
      expect(post.references, `${post.slug} references`).toBeDefined()
      expect(post.references!.length, `${post.slug} references length`).toBeGreaterThan(0)
      for (const ref of post.references!) {
        expect(ref.label.length).toBeGreaterThan(0)
        expect(ref.url).toMatch(/^https:\/\//)
      }
    }
  })

  it('exposes a reading time in minutes for every post, explicit or estimated', () => {
    for (const post of getAllPosts()) {
      const minutes = getReadingMinutes(post)
      expect(minutes).toBeGreaterThan(0)
    }
  })
})
