import type { MetadataRoute } from 'next'
import { getAllVideos } from '@/lib/videos'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/videos`, priority: 0.9 },
    { url: `${SITE_URL}/about`, priority: 0.6 },
    { url: `${SITE_URL}/blog`, priority: 0.3 },
    { url: `${SITE_URL}/books`, priority: 0.3 },
    { url: `${SITE_URL}/projects`, priority: 0.3 },
  ]
  const videoRoutes: MetadataRoute.Sitemap = getAllVideos().map((video) => ({
    url: `${SITE_URL}/videos/${video.id}`,
    lastModified: video.publishedDate,
    priority: 0.7,
  }))
  return [...staticRoutes, ...videoRoutes]
}
