import postsData from './posts.json'

export interface PostReference {
  label: string
  url: string
}

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  publishedDate: string
  relatedVideoId?: string
  body: string
  references?: PostReference[]
  readingMinutes?: number
}

export function getAllPosts(): Post[] {
  return (postsData as Post[]).slice().sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

/** Falls back to a ~200-wpm estimate when a post doesn't carry an explicit readingMinutes value. */
export function getReadingMinutes(post: Post): number {
  if (post.readingMinutes) return post.readingMinutes
  const words = post.body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}
