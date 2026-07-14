import type { MetadataRoute } from 'next'
import { getAllVideos } from '@/lib/videos'
import { getAllPosts } from '@/lib/blog'
import { getAllCourses } from '@/lib/courses'
import { getAllSessions } from '@/lib/sessions'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/feed`, priority: 0.8 },
    { url: `${SITE_URL}/videos`, priority: 0.9 },
    { url: `${SITE_URL}/moments`, priority: 0.6 },
    { url: `${SITE_URL}/stats`, priority: 0.5 },
    { url: `${SITE_URL}/about`, priority: 0.6 },
    { url: `${SITE_URL}/blog`, priority: 0.3 },
    { url: `${SITE_URL}/books`, priority: 0.3 },
    { url: `${SITE_URL}/projects`, priority: 0.3 },
    { url: `${SITE_URL}/journey`, priority: 0.5 },
    { url: `${SITE_URL}/ask`, priority: 0.6 },
    { url: `${SITE_URL}/courses`, priority: 0.8 },
    { url: `${SITE_URL}/sessions`, priority: 0.8 },
  ]
  const courseRoutes: MetadataRoute.Sitemap = getAllCourses().map((course) => ({
    url: `${SITE_URL}/courses/${course.slug}`,
    priority: 0.7,
  }))
  const sessionRoutes: MetadataRoute.Sitemap = getAllSessions().map((session) => ({
    url: `${SITE_URL}/sessions/${session.slug}`,
    priority: 0.7,
  }))
  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.publishedDate,
    priority: 0.6,
  }))
  const videoRoutes: MetadataRoute.Sitemap = getAllVideos().map((video) => ({
    url: `${SITE_URL}/videos/${video.id}`,
    lastModified: video.publishedDate,
    priority: 0.7,
  }))
  return [...staticRoutes, ...courseRoutes, ...sessionRoutes, ...postRoutes, ...videoRoutes]
}
