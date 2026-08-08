import videosData from './videos.json'
import type { Video } from './video-search'

/**
 * Server-side video data access.
 *
 * The Video type and the pure search helpers live in ./video-search so that client
 * components can import them without dragging videos.json into the browser bundle.
 * They are re-exported here so existing server imports keep working unchanged.
 */
export type { Video }
export { SEARCH_SYNONYMS, searchAndFilterVideos } from './video-search'

export function getAllVideos(): Video[] {
  return (videosData as Video[])
    .slice()
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

export function getFeaturedVideos(): Video[] {
  return getAllVideos().filter((video) => video.featured)
}

export function getVideoBySlug(slug: string): Video | undefined {
  return getAllVideos().find((video) => video.id === slug)
}

export function getAllCategories(): string[] {
  const categories = getAllVideos().map((video) => video.category)
  return Array.from(new Set(categories)).sort()
}

export function getCategoryCounts(): { category: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const video of getAllVideos()) {
    counts.set(video.category, (counts.get(video.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}
