import videosData from './videos.json'

export interface Video {
  id: string
  title: string
  instagramUrl: string
  youtubeUrl?: string
  thumbnail: string | null
  category: string
  tags: string[]
  problemSolved?: string
  shortDescription: string
  detailedDescription: string
  keyLessons?: string[]
  featured: boolean
  publishedDate: string
}

export function getAllVideos(): Video[] {
  return (videosData as Video[])
    .slice()
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

export function getFeaturedVideos(): Video[] {
  return getAllVideos().filter((video) => video.featured)
}

export function getVideoBySlug(slug: string): Video | undefined {
  return getAllVideos().find((video) => video.id === slug)
}

export function getAllCategories(): string[] {
  const categories = getAllVideos().map((video) => video.category)
  return Array.from(new Set(categories)).sort()
}

export function getCategoryCounts(): { category: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const video of getAllVideos()) {
    counts.set(video.category, (counts.get(video.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Concept synonyms: expands what people naturally type into the vocabulary
 * the captions actually use. Searching "exercise" should surface workout
 * content even though no caption contains the literal word. Add new
 * entries freely — lowercase key, lowercase expansions.
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  exercise: ['workout', 'fitness', 'calisthenics', 'training', 'gym'],
  exercises: ['workout', 'fitness', 'calisthenics', 'training'],
  gym: ['workout', 'fitness', 'calisthenics'],
  training: ['workout', 'fitness', 'calisthenics'],
  muscle: ['workout', 'fitness', 'calisthenics', 'physique'],
  bodyweight: ['calisthenics', 'workout', 'push'],
  run: ['running', 'cardio'],
  motivation: ['discipline', 'mindset', 'consistency'],
  habit: ['discipline', 'system', 'routine'],
  habits: ['discipline', 'system', 'routine'],
  philosophy: ['thinkers', 'mindset', 'wisdom'],
  productivity: ['discipline', 'system', 'consistency'],
  app: ['ai', 'application', 'builds'],
  apps: ['ai', 'application', 'builds'],
  tech: ['ai', 'builds', 'application'],
  artificial: ['ai'],
  intelligence: ['ai'],
  funny: ['humor', 'roast', 'meme', 'tamil'],
  comedy: ['humor', 'roast', 'meme', 'tamil'],
  meme: ['humor', 'tamil', 'roast'],
  travel: ['life', 'place', 'ride'],
  food: ['diet', 'life'],
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .split(/[^a-z0-9஀-௿]+/)
    .filter((t) => t.length > 0)
}

/** A query token matches a word if either is a prefix of the other (≥3 chars). */
function tokenMatchesWord(token: string, word: string): boolean {
  if (token === word) return true
  if (token.length >= 3 && word.startsWith(token)) return true
  if (word.length >= 3 && token.startsWith(word)) return true
  return false
}

function scoreVideo(video: Video, queryTokens: string[][]): number {
  const titleWords = tokenize(video.title)
  const tagWords = tokenize(video.tags.join(' ') + ' ' + video.category)
  const bodyWords = tokenize(video.shortDescription + ' ' + video.detailedDescription)

  let score = 0
  // Every query token (or one of its synonyms) must match somewhere.
  for (const alternatives of queryTokens) {
    let tokenScore = 0
    for (const alt of alternatives) {
      if (titleWords.some((w) => tokenMatchesWord(alt, w))) tokenScore = Math.max(tokenScore, 3)
      else if (tagWords.some((w) => tokenMatchesWord(alt, w))) tokenScore = Math.max(tokenScore, 2)
      else if (bodyWords.some((w) => tokenMatchesWord(alt, w))) tokenScore = Math.max(tokenScore, 1)
    }
    if (tokenScore === 0) return 0
    score += tokenScore
  }
  return score
}

export function searchAndFilterVideos(
  videos: Video[],
  query: string,
  category: string | null
): Video[] {
  const pool = category ? videos.filter((v) => v.category === category) : videos
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return pool

  // Each query token becomes a set of alternatives: itself + its synonyms.
  const queryTokens = tokenize(trimmed).map((token) => [
    token,
    ...(SEARCH_SYNONYMS[token] ?? []),
  ])
  if (queryTokens.length === 0) return pool

  return pool
    .map((video) => ({ video, score: scoreVideo(video, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ video }) => video)
}
