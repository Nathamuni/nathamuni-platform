import videosData from './videos.json'
import storiesData from './stories.json'
import type { Video } from './videos'
import type { Story } from './stories'

export interface StatsTotals {
  videos: number
  reels: number
  posts: number
  stories: number
  categories: number
}

export interface CategoryShare {
  category: string
  count: number
  /** Percentage of the library, 0-100 (not rounded — round at render time). */
  share: number
}

export interface TimelineEntry {
  label: string
  count: number
}

export interface TagFrequency {
  tag: string
  count: number
}

export interface StreakStats {
  /** Longest run of consecutive calendar days with at least one post. */
  longestStreakDays: number
  /** Average days between consecutive publish dates; null with fewer than 2 unique dates. */
  currentCadenceDays: number | null
}

export interface TopEngagementVideo {
  id: string
  title: string
  thumbnail: string | null
  count: number
}

export interface StatsData {
  totals: StatsTotals
  categoryShares: CategoryShare[]
  timeline: TimelineEntry[]
  streak: StreakStats
  topTags: TagFrequency[]
  featuredCount: number
  hasEngagementData: boolean
  topLiked: TopEngagementVideo[]
  topCommented: TopEngagementVideo[]
}

/** Absent mediaType means a pre-mediaType-field reel (see Video['mediaType'] doc). */
function isReel(video: Video): boolean {
  return video.mediaType !== 'post'
}

export function computeTotals(videos: Video[], stories: Story[]): StatsTotals {
  const categories = new Set(videos.map((v) => v.category))
  return {
    videos: videos.length,
    reels: videos.filter(isReel).length,
    posts: videos.filter((v) => v.mediaType === 'post').length,
    stories: stories.length,
    categories: categories.size,
  }
}

export function computeCategoryShares(videos: Video[]): CategoryShare[] {
  const counts = new Map<string, number>()
  for (const video of videos) {
    counts.set(video.category, (counts.get(video.category) ?? 0) + 1)
  }
  const total = videos.length
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      count,
      share: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

/** Last `months` calendar months (inclusive of the current one), oldest first. */
export function computeTimeline(
  videos: Video[],
  months = 12,
  now: Date = new Date()
): TimelineEntry[] {
  const buckets: { key: string; label: string }[] = []
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(start.getFullYear(), start.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: monthLabel(d) })
  }
  const counts = new Map<string, number>(buckets.map((b) => [b.key, 0]))
  for (const video of videos) {
    const key = video.publishedDate.slice(0, 7)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return buckets.map((b) => ({ label: b.label, count: counts.get(b.key) ?? 0 }))
}

export function computeStreak(videos: Video[]): StreakStats {
  const uniqueDates = Array.from(new Set(videos.map((v) => v.publishedDate))).sort()
  if (uniqueDates.length === 0) {
    return { longestStreakDays: 0, currentCadenceDays: null }
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / MS_PER_DAY

  let longest = 1
  let current = 1
  const gaps: number[] = []
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = toDay(uniqueDates[i]) - toDay(uniqueDates[i - 1])
    gaps.push(diff)
    if (diff === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  const currentCadenceDays =
    gaps.length > 0 ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : null

  return { longestStreakDays: longest, currentCadenceDays }
}

export function computeTopTags(videos: Video[], limit = 10): TagFrequency[] {
  const counts = new Map<string, number>()
  for (const video of videos) {
    for (const tag of video.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit)
}

export function computeFeaturedCount(videos: Video[]): number {
  return videos.filter((v) => v.featured).length
}

function hasAnyEngagementData(videos: Video[]): boolean {
  return videos.some((v) => typeof v.likeCount === 'number' || typeof v.commentsCount === 'number')
}

function topByField(
  videos: Video[],
  field: 'likeCount' | 'commentsCount',
  limit: number
): TopEngagementVideo[] {
  return videos
    .filter((v) => typeof v[field] === 'number')
    .sort((a, b) => (b[field] as number) - (a[field] as number))
    .slice(0, limit)
    .map((v) => ({ id: v.id, title: v.title, thumbnail: v.thumbnail, count: v[field] as number }))
}

export function computeTopEngagement(
  videos: Video[],
  limit = 5
): { hasEngagementData: boolean; topLiked: TopEngagementVideo[]; topCommented: TopEngagementVideo[] } {
  const hasEngagementData = hasAnyEngagementData(videos)
  if (!hasEngagementData) {
    return { hasEngagementData: false, topLiked: [], topCommented: [] }
  }
  return {
    hasEngagementData: true,
    topLiked: topByField(videos, 'likeCount', limit),
    topCommented: topByField(videos, 'commentsCount', limit),
  }
}

/** Full stats bundle for the /stats page — computed once at build time from static JSON. */
export function buildStats(videos: Video[], stories: Story[]): StatsData {
  const engagement = computeTopEngagement(videos)
  return {
    totals: computeTotals(videos, stories),
    categoryShares: computeCategoryShares(videos),
    timeline: computeTimeline(videos),
    streak: computeStreak(videos),
    topTags: computeTopTags(videos),
    featuredCount: computeFeaturedCount(videos),
    ...engagement,
  }
}

export function getStats(): StatsData {
  return buildStats(videosData as Video[], storiesData as Story[])
}
