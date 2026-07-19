import videosData from './videos.json'
import insightsData from './insights.json'
import historyData from './insights-history.json'
import type { Video } from './videos'
import { getCategoryMeta } from './categoryMeta'

/**
 * Aggregates for the /pulse insights dashboard — all computed from real data
 * (lib/videos.json + insights.json + insights-history.json). Metrics that aren't
 * populated yet (reach/saves/shares/watch-time, and multi-day growth) simply
 * yield empty/short series until the daily sync fills them; nothing is faked.
 */

export type Metric = 'engagement' | 'likes' | 'comments' | 'posts'

export interface CategoryDatum {
  category: string
  hue: number
  posts: number
  share: number // % of library
  medER: number
  avgLikes: number
  totalLikes: number
  totalComments: number
}

export interface WeekdayDatum {
  label: string
  posts: number
  likes: number
  comments: number
  medER: number
}

export interface MonthDatum {
  label: string
  posts: number
  medER: number
}

export interface TagDatum {
  tag: string
  count: number
  medER: number
}

export interface DistBucket {
  label: string
  count: number
}

export interface GrowthPoint {
  date: string
  followers: number
  reach30: number | null
}

export interface DashboardData {
  followers: number | null
  reach30: number | null
  profileViews: number | null
  totalPosts: number
  medianER: number
  reels: number
  photoPosts: number
  categories: CategoryDatum[]
  weekday: WeekdayDatum[]
  months: MonthDatum[]
  topTags: TagDatum[]
  distribution: DistBucket[]
  growth: GrowthPoint[]
  /** True once per-post reach/saves have been synced (unlocks richer charts). */
  hasReach: boolean
}

const median = (a: number[]): number => {
  if (a.length === 0) return 0
  const s = [...a].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function buildDashboard(
  videos: Video[] = videosData as Video[],
  insights = insightsData as { followersCount?: number; reachLast30Days?: number; profileViewsLast30Days?: number },
  history: GrowthPoint[] = historyData as GrowthPoint[]
): DashboardData {
  const followers = insights.followersCount ?? null
  const denom = followers && followers > 0 ? followers : 1
  const er = (v: Video) => ((v.likeCount ?? 0) + (v.commentsCount ?? 0)) / denom * 100

  // Categories
  const catMap = new Map<string, Video[]>()
  for (const v of videos) {
    if (!catMap.has(v.category)) catMap.set(v.category, [])
    catMap.get(v.category)!.push(v)
  }
  const categories: CategoryDatum[] = [...catMap.entries()]
    .map(([category, vs]) => ({
      category,
      hue: getCategoryMeta(category).hue,
      posts: vs.length,
      share: (vs.length / videos.length) * 100,
      medER: median(vs.map(er)),
      avgLikes: Math.round(vs.reduce((s, v) => s + (v.likeCount ?? 0), 0) / vs.length),
      totalLikes: vs.reduce((s, v) => s + (v.likeCount ?? 0), 0),
      totalComments: vs.reduce((s, v) => s + (v.commentsCount ?? 0), 0),
    }))
    .sort((a, b) => b.posts - a.posts)

  // Weekday
  const wdBuckets = new Map<number, Video[]>(WD_ORDER.map((d) => [d, []]))
  for (const v of videos) {
    const d = new Date(`${v.publishedDate}T00:00:00Z`).getUTCDay()
    wdBuckets.get(d)?.push(v)
  }
  const weekday: WeekdayDatum[] = WD_ORDER.map((d) => {
    const vs = wdBuckets.get(d)!
    return {
      label: WD[d],
      posts: vs.length,
      likes: vs.reduce((s, v) => s + (v.likeCount ?? 0), 0),
      comments: vs.reduce((s, v) => s + (v.commentsCount ?? 0), 0),
      medER: median(vs.map(er)),
    }
  })

  // Last 12 months
  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  const now = new Date(`${(insightsData as { fetchedAt?: string }).fetchedAt ?? '2026-07-19'}T00:00:00Z`)
  const months: MonthDatum[] = []
  const mBuckets = new Map<string, Video[]>()
  for (const v of videos) {
    const k = v.publishedDate.slice(0, 7)
    if (!mBuckets.has(k)) mBuckets.set(k, [])
    mBuckets.get(k)!.push(v)
  }
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const k = monthKey(d)
    const vs = mBuckets.get(k) ?? []
    months.push({
      label: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
      posts: vs.length,
      medER: median(vs.map(er)),
    })
  }

  // Top tags
  const tagBuckets = new Map<string, Video[]>()
  for (const v of videos) for (const t of v.tags) {
    if (!tagBuckets.has(t)) tagBuckets.set(t, [])
    tagBuckets.get(t)!.push(v)
  }
  const topTags: TagDatum[] = [...tagBuckets.entries()]
    .filter(([, vs]) => vs.length >= 4)
    .map(([tag, vs]) => ({ tag, count: vs.length, medER: median(vs.map(er)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Engagement-rate distribution
  const edges = [0, 1, 2, 3, 5, 10, Infinity]
  const labels = ['<1%', '1–2%', '2–3%', '3–5%', '5–10%', '10%+']
  const distribution: DistBucket[] = labels.map((label, i) => ({
    label,
    count: videos.filter((v) => {
      const e = er(v)
      return e >= edges[i] && e < edges[i + 1]
    }).length,
  }))

  const growth: GrowthPoint[] = (Array.isArray(history) ? history : [])
    .filter((h) => typeof h.followers === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    followers,
    reach30: insights.reachLast30Days ?? null,
    profileViews: insights.profileViewsLast30Days ?? null,
    totalPosts: videos.length,
    medianER: median(videos.map(er)),
    reels: videos.filter((v) => v.mediaType !== 'post').length,
    photoPosts: videos.filter((v) => v.mediaType === 'post').length,
    categories,
    weekday,
    months,
    topTags,
    distribution,
    growth,
    hasReach: videos.some((v) => typeof v.reach === 'number'),
  }
}
