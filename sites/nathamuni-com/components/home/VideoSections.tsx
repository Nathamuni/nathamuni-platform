'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { VideoCard } from '@/components/video/VideoCard'

interface Video {
  id: string
  title: string
  instagramUrl: string
  youtubeUrl?: string
  youtubeId?: string
  youtubeStatus?: 'private' | 'public' | 'unlisted' | 'failed' | 'skipped-too-large'
  thumbnail: string | null
  mediaType?: 'reel' | 'post'
  category: string
  tags: string[]
  problemSolved?: string
  shortDescription: string
  detailedDescription: string
  keyLessons?: string[]
  featured: boolean
  publishedDate: string
  likeCount?: number
  commentsCount?: number
  reach?: number
  saved?: number
  shares?: number
  views?: number
  avgWatchTimeMs?: number
}

export function VideoSections() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/videos.json')
        if (res.ok) {
          const data = await res.json()
          const sorted = (data as Video[])
            .slice()
            .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
          setVideos(sorted)
        }
      } catch (err) {
        console.error('Failed to fetch videos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) {
    return <div className="video-grid"><div>Loading...</div></div>
  }

  // One card per category, always the newest in that category — replaces a
  // hand-picked "featured" flag that went stale the moment new videos landed.
  const latestByCategory: Video[] = []
  const seenCategories = new Set<string>()
  for (const video of videos) {
    if (seenCategories.has(video.category)) continue
    seenCategories.add(video.category)
    latestByCategory.push(video)
  }

  const latest = videos.filter((v) => (v.mediaType ?? 'reel') === 'reel').slice(0, 4)
  const totalCount = videos.length

  return (
    <>
      <section className="section" aria-labelledby="featured-heading" data-reveal data-reveal-3d>
        <h2 id="featured-heading" className="section-title">
          Start here
        </h2>
        <p className="section-sub">The newest video from every pillar — always up to date.</p>
        <div className="video-grid" data-testid="featured-grid">
          {latestByCategory.map((video, i) => (
            <div key={video.id} className={`anim-fade-up anim-delay-${Math.min(i, 4)} h-full`}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="latest-heading" data-reveal data-reveal-3d>
        <div className="section-head-row">
          <div>
            <h2 id="latest-heading" className="section-title">
              Latest drops
            </h2>
            <p className="section-sub">Fresh from the feed.</p>
          </div>
        </div>
        <div className="video-grid" data-testid="latest-grid">
          {latest.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
        <Link href="/videos" className="link-more" data-testid="browse-all-link">
          Browse all {totalCount} videos →
        </Link>
      </section>
    </>
  )
}
