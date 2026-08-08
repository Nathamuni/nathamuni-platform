import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllVideos, getVideoBySlug } from '@/lib/videos'
import { SITE_URL } from '@/lib/site'
import { VideoDetail } from '@/components/video/VideoDetail'

export function generateStaticParams() {
  return getAllVideos().map((video) => ({ slug: video.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const video = getVideoBySlug(slug)
  if (!video) return {}
  return {
    title: video.title,
    description: video.shortDescription,
    alternates: { canonical: `/videos/${video.id}` },
    openGraph: {
      type: 'article',
      url: `/videos/${video.id}`,
      title: video.title,
      description: video.shortDescription,
      images: video.thumbnail ? [{ url: video.thumbnail }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const video = getVideoBySlug(slug)
  if (!video) {
    notFound()
  }
  const related = getAllVideos()
    .filter((v) => v.category === video.category && v.id !== video.id)
    .slice(0, 4)

  const videoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.shortDescription,
    thumbnailUrl: video.thumbnail ? `${SITE_URL}${video.thumbnail}` : undefined,
    uploadDate: video.publishedDate,
    url: `${SITE_URL}/videos/${video.id}`,
    // embedUrl must be a player URL, not a page. It previously pointed at the Instagram
    // post page, which is not embeddable — so search engines had nothing playable.
    // Omitted entirely rather than falsified when there is no public YouTube copy.
    embedUrl:
      video.youtubeId && video.youtubeStatus === 'public'
        ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}`
        : undefined,
    // No contentUrl: it must point at the media file itself, not a watch page. There is
    // no direct media URL here, so it is omitted rather than filled with a page URL.
    genre: video.category,
    keywords: video.tags.join(', '),
    author: { '@type': 'Person', name: 'Nathamuni', url: SITE_URL },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <VideoDetail video={video} related={related} />
    </>
  )
}
