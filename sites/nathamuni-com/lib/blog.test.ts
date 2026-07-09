import { describe, expect, it } from 'vitest'
import { getAllPosts, getPostBySlug } from './blog'

describe('blog', () => {
  it('returns posts newest first with unique slugs', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThanOrEqual(3)
    const dates = posts.map((p) => p.publishedDate)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length)
  })

  it('finds a post by slug and has real body content', () => {
    const post = getPostBySlug('build-the-chain-systems-beat-motivation')
    expect(post?.title).toContain('Build the Chain')
    expect(post!.body.length).toBeGreaterThan(400)
  })

  it('returns undefined for unknown slugs', () => {
    expect(getPostBySlug('nope')).toBeUndefined()
  })
})
