import { getAllPosts } from '@/lib/blog'
import { getAllVideos } from '@/lib/videos'
import { PROFILE } from '@/lib/profile'
import { SITE_NAME, SITE_URL } from '@/lib/site'

/**
 * RSS 2.0 feed at /feed.xml.
 *
 * The site had no feed at all, which is free distribution left unused for someone
 * publishing regularly. Blog posts and videos are merged into one reverse-chronological
 * stream so a single subscription covers everything.
 *
 * force-static because the site is `output: 'export'` — this is generated at build
 * time and served as a static asset, like sitemap.ts and robots.ts.
 */
export const dynamic = 'force-static'

const MAX_ITEMS = 50

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(isoDate: string): string {
  // Dates are stored as plain YYYY-MM-DD; anchor to midday UTC so timezone shifts
  // can't roll an item onto the previous day.
  return new Date(`${isoDate}T12:00:00Z`).toUTCString()
}

export function GET(): Response {
  const items = [
    ...getAllPosts().map((post) => ({
      title: post.title,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.excerpt ?? '',
      date: post.publishedDate,
      category: post.category,
    })),
    ...getAllVideos().map((video) => ({
      title: video.title,
      link: `${SITE_URL}/videos/${video.id}`,
      description: video.shortDescription ?? '',
      date: video.publishedDate,
      category: video.category,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ITEMS)

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(PROFILE.metaDescription)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${toRfc822(item.date)}</pubDate>
      <category>${escapeXml(item.category)}</category>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
