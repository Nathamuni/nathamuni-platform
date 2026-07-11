import { getAllVideos } from './videos'
import { getAllStories } from './stories'
import { getAllPosts } from './blog'
import { getCategoryMeta } from './categoryMeta'

export type FeedKind = 'reel' | 'post' | 'story' | 'blog'

export interface FeedEntry {
  kind: FeedKind
  date: string
  id: string
  title: string
  href: string
  image: string | null
  category?: string
  hue: number
  /** Only set for blog entries — the timeline shows a richer row for those. */
  excerpt?: string
}

/** Life & Moments' hue — stories don't carry a category of their own. */
const STORY_HUE = 340

/** Same-date tiebreak order the owner asked for. */
const KIND_PRIORITY: Record<FeedKind, number> = {
  blog: 0,
  reel: 1,
  post: 2,
  story: 3,
}

function videoEntries(): FeedEntry[] {
  return getAllVideos().map((video) => {
    const meta = getCategoryMeta(video.category)
    return {
      kind: (video.mediaType ?? 'reel') === 'post' ? 'post' : 'reel',
      date: video.publishedDate,
      id: video.id,
      title: video.title,
      href: `/videos/${video.id}`,
      image: video.thumbnail,
      category: video.category,
      hue: meta.hue,
    }
  })
}

function storyEntries(): FeedEntry[] {
  return getAllStories().map((story) => ({
    kind: 'story',
    date: story.date,
    id: story.id,
    title: story.title ?? 'A moment from the archive',
    href: '/moments',
    image: story.poster,
    hue: STORY_HUE,
  }))
}

function blogEntries(): FeedEntry[] {
  return getAllPosts().map((post) => {
    const meta = getCategoryMeta(post.category)
    return {
      kind: 'blog',
      date: post.publishedDate,
      id: post.slug,
      title: post.title,
      href: `/blog/${post.slug}`,
      image: null,
      category: post.category,
      hue: meta.hue,
      excerpt: post.excerpt,
    }
  })
}

/**
 * One reverse-chronological stream of everything published: reels, photo
 * posts, archived stories, and blog essays. Ties on the same date fall back
 * to a fixed kind order (blog, reel, post, story) — Array#sort is stable, so
 * entries that also share a kind keep their original relative order.
 */
export function getFeed(): FeedEntry[] {
  const entries: FeedEntry[] = [...videoEntries(), ...storyEntries(), ...blogEntries()]
  return entries.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
  })
}

/** Convenience slice for callers that only want the first N entries. */
export function getFeedPage(limit: number): FeedEntry[] {
  return getFeed().slice(0, limit)
}
