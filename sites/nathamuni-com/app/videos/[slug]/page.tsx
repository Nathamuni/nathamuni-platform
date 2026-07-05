import { notFound } from 'next/navigation'
import { getAllVideos, getVideoBySlug } from '@/lib/videos'
import { VideoDetail } from '@/components/video/VideoDetail'

export function generateStaticParams() {
  return getAllVideos().map((video) => ({ slug: video.id }))
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
  return <VideoDetail video={video} />
}
