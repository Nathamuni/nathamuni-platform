import postsData from './posts.json'

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  publishedDate: string
  relatedVideoId?: string
  body: string
}

export function getAllPosts(): Post[] {
  return (postsData as Post[]).slice().sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}
