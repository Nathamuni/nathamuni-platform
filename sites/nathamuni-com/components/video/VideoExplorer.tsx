'use client'

import { useMemo, useState } from 'react'
import { getAllCategories, searchAndFilterVideos, type Video } from '@/lib/videos'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { VideoGrid } from './VideoGrid'

export function VideoExplorer({
  videos,
  featuredIds,
}: {
  videos: Video[]
  featuredIds?: string[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const categories = useMemo(() => getAllCategories(), [])
  const isBrowsing = query.trim().length > 0 || category !== null

  const results = useMemo(() => {
    if (!isBrowsing && featuredIds) {
      return videos.filter((video) => featuredIds.includes(video.id))
    }
    return searchAndFilterVideos(videos, query, category)
  }, [videos, query, category, isBrowsing, featuredIds])

  return (
    <div className="video-explorer" data-testid="video-explorer">
      <div className="video-explorer-controls">
        <SearchBar value={query} onChange={setQuery} />
        <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
      </div>
      <VideoGrid videos={results} />
    </div>
  )
}
