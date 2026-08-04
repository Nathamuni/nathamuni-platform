'use client'

import { useEffect, useMemo, useState } from 'react'
// From lib/video-search, not lib/videos — the latter imports videos.json and would
// bundle the whole catalog into this client component.
import { searchAndFilterVideos, type Video } from '@/lib/video-search'
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
  const [mediaType, setMediaType] = useState<'all' | 'reel' | 'post'>('all')
  const [semanticIds, setSemanticIds] = useState<string[]>([])
  // Derived from the videos already passed in, rather than re-reading the catalog.
  // Same result as getAllCategories(): unique categories, sorted.
  const categories = useMemo(
    () => Array.from(new Set(videos.map((v) => v.category))).sort(),
    [videos]
  )

  // Deep-link support on a static export: category tiles and tag pills link
  // to /videos?category=... / ?tag=... / ?q=..., read client-side on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    const tag = params.get('tag')
    const q = params.get('q')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cat && categories.includes(cat)) setCategory(cat)
    if (tag) setQuery(tag)
    else if (q) setQuery(q)
  }, [categories])

  // Semantic search: ask the site Worker (/api/search, Workers AI bge-m3)
  // for meaning-based matches and blend them in after keyword hits.
  // Degrades silently when the endpoint is unavailable (e.g. local dev).
  useEffect(() => {
    const q = query.trim()
    if (q.length < 4) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSemanticIds([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data: { results?: { id: string }[] }) =>
          setSemanticIds((data.results ?? []).map((r) => r.id))
        )
        .catch(() => {})
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const isBrowsing = query.trim().length > 0 || category !== null || mediaType !== 'all'

  const results = useMemo(() => {
    if (!isBrowsing && featuredIds) {
      return videos.filter((video) => featuredIds.includes(video.id))
    }
    const matchesFacets = (v: Video) =>
      (category === null || v.category === category) &&
      (mediaType === 'all' || (v.mediaType ?? 'reel') === mediaType)

    const keyword = searchAndFilterVideos(videos, query, category).filter(matchesFacets)
    if (semanticIds.length === 0) return keyword

    const seen = new Set(keyword.map((v) => v.id))
    const semantic = semanticIds
      .map((id) => videos.find((v) => v.id === id))
      .filter((v): v is Video => Boolean(v) && !seen.has(v!.id) && matchesFacets(v!))
    return [...keyword, ...semantic]
  }, [videos, query, category, mediaType, isBrowsing, featuredIds, semanticIds])

  return (
    <div className="video-explorer" data-testid="video-explorer">
      <div className="video-explorer-controls">
        <SearchBar value={query} onChange={setQuery} />
        <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
        <div className="type-filter" role="group" aria-label="Filter by type" data-testid="type-filter">
          {(['all', 'reel', 'post'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={mediaType === t ? 'category-filter-btn is-active' : 'category-filter-btn'}
              onClick={() => setMediaType(t)}
            >
              {t === 'all' ? 'Everything' : t === 'reel' ? '🎬 Reels' : '📷 Posts'}
            </button>
          ))}
        </div>
        {isBrowsing && (
          <span className="explorer-count" data-testid="explorer-count">
            {results.length} result{results.length === 1 ? '' : 's'} found
          </span>
        )}
      </div>
      <VideoGrid videos={results} />
    </div>
  )
}
