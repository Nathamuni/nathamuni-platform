import videosData from './videos.json'

export interface Video {
  id: string
  title: string
  instagramUrl: string
  youtubeUrl?: string
  thumbnail: string | null
  category: string
  tags: string[]
  problemSolved?: string
  shortDescription: string
  detailedDescription: string
  keyLessons?: string[]
  featured: boolean
  publishedDate: string
}

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

export function searchAndFilterVideos(
  videos: Video[],
  query: string,
  category: string | null
): Video[] {
  const normalizedQuery = query.trim().toLowerCase()
  return videos.filter((video) => {
    if (category && video.category !== category) return false
    if (!normalizedQuery) return true
    const haystack = [
      video.title,
      video.shortDescription,
      video.detailedDescription,
      video.category,
      ...video.tags,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}
