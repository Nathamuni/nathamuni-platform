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
  const related = getAllVideos()
    .filter((v) => v.category === video.category && v.id !== video.id)
    .slice(0, 4)
  return <VideoDetail video={video} related={related} />
}
