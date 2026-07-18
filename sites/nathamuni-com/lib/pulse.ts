import videosData from './videos.json'
import insightsData from './insights.json'
import type { Video } from './videos'
import { getCategoryMeta } from './categoryMeta'

/**
 * Pulse graph — the real content network behind the /pulse visualization.
 *
 * Nodes and edges are built from actual posts (lib/videos.json) and account
 * insights (lib/insights.json). Nothing here is decorative-only: node size is
 * real engagement, edges are real category/tag membership. The "live" flag is
 * true only when the insights fetch has supplied genuine account data.
 */

export interface PulseNode {
  id: string
  kind: 'category' | 'post' | 'tag'
  label: string
  hue: number
  /** 0..1 normalized importance — drives node radius and glow. */
  weight: number
  /** Engagement rate (%) for post nodes; used in tooltips. */
  er?: number
  category?: string
}

export interface PulseEdge {
  source: string
  target: string
  /** 0..1 — drives line opacity and pulse frequency. */
  strength: number
}

export interface PulseStats {
  followers: number | null
  posts: number
  categories: number
  /** Median engagement rate across all posts, %. */
  medianER: number
  /** Best category by median ER. */
  topCategory: string
  reachLast30Days: number | null
  /** Hourly followers-online map (0-23 -> count), or null if not yet fetched. */
  onlineFollowersByHour: Record<string, number> | null
  /** True once real account insights (beyond seed) are present. */
  live: boolean
  updatedAt: string
}

export interface PulseGraphData {
  nodes: PulseNode[]
  edges: PulseEdge[]
  stats: PulseStats
}

const MAX_POST_NODES = 40
const MAX_TAG_NODES = 18
const MIN_TAG_COUNT = 4

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

interface RawInsights {
  followersCount?: number | null
  reachLast30Days?: number | null
  onlineFollowersByHour?: Record<string, number> | null
  fetchedAt?: string
  [key: string]: unknown
}

export function buildPulseGraph(
  videos: Video[] = videosData as Video[],
  insights: RawInsights = insightsData as RawInsights
): PulseGraphData {
  const followers = insights.followersCount ?? null
  const denom = followers && followers > 0 ? followers : 1
  const er = (v: Video) => ((v.likeCount ?? 0) + (v.commentsCount ?? 0)) / denom * 100

  const nodes: PulseNode[] = []
  const edges: PulseEdge[] = []

  // --- Category hubs ---
  const catMap = new Map<string, Video[]>()
  for (const v of videos) {
    if (!catMap.has(v.category)) catMap.set(v.category, [])
    catMap.get(v.category)!.push(v)
  }
  const catTotals = [...catMap.entries()].map(([c, vs]) => ({
    category: c,
    total: vs.reduce((s, v) => s + (v.likeCount ?? 0) + (v.commentsCount ?? 0), 0),
    medER: median(vs.map(er)),
  }))
  const maxCatTotal = Math.max(1, ...catTotals.map((c) => c.total))
  for (const c of catTotals) {
    nodes.push({
      id: `cat:${c.category}`,
      kind: 'category',
      label: c.category,
      hue: getCategoryMeta(c.category).hue,
      weight: 0.55 + 0.45 * normalize(c.total, 0, maxCatTotal),
      category: c.category,
    })
  }

  // --- Post neurons (top by engagement rate) ---
  const ranked = [...videos].sort((a, b) => er(b) - er(a)).slice(0, MAX_POST_NODES)
  const ers = ranked.map(er)
  const minER = Math.min(...ers)
  const maxER = Math.max(...ers)
  const includedPostIds = new Set<string>()
  for (const v of ranked) {
    includedPostIds.add(v.id)
    nodes.push({
      id: `post:${v.id}`,
      kind: 'post',
      label: v.title,
      hue: getCategoryMeta(v.category).hue,
      weight: 0.2 + 0.8 * normalize(er(v), minER, maxER),
      er: er(v),
      category: v.category,
    })
    edges.push({
      source: `post:${v.id}`,
      target: `cat:${v.category}`,
      strength: 0.35 + 0.5 * normalize(er(v), minER, maxER),
    })
  }

  // --- Tag synapses (top tags shared across the included posts) ---
  const tagCounts = new Map<string, number>()
  for (const v of ranked) for (const t of v.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const topTags = [...tagCounts.entries()]
    .filter(([, n]) => n >= MIN_TAG_COUNT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAG_NODES)
  const maxTagCount = Math.max(1, ...topTags.map(([, n]) => n))
  for (const [tag, count] of topTags) {
    nodes.push({
      id: `tag:${tag}`,
      kind: 'tag',
      label: `#${tag}`,
      hue: 210,
      weight: 0.15 + 0.4 * normalize(count, MIN_TAG_COUNT, maxTagCount),
    })
    for (const v of ranked) {
      if (v.tags.includes(tag)) {
        edges.push({
          source: `post:${v.id}`,
          target: `tag:${tag}`,
          strength: 0.15 + 0.35 * normalize(count, MIN_TAG_COUNT, maxTagCount),
        })
      }
    }
  }

  const allER = videos.map(er)
  const topCategory = [...catTotals].sort((a, b) => b.medER - a.medER)[0]?.category ?? '—'

  const onlineHours = insights.onlineFollowersByHour ?? null

  const stats: PulseStats = {
    followers,
    posts: videos.length,
    categories: catMap.size,
    medianER: median(allER),
    topCategory,
    reachLast30Days: insights.reachLast30Days ?? null,
    onlineFollowersByHour: onlineHours,
    live: Boolean(insights.reachLast30Days || onlineHours),
    updatedAt: insights.fetchedAt ?? '',
  }

  return { nodes, edges, stats }
}
