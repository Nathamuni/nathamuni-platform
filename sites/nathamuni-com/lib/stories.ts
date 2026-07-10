import storiesData from './stories.json'

export interface Story {
  id: string
  date: string
  video: string
  /** Null when ffmpeg poster extraction failed (self-healed on a later sync run). */
  poster: string | null
  title: string | null
}

export function getAllStories(): Story[] {
  return (storiesData as Story[]).slice().sort((a, b) => b.date.localeCompare(a.date))
}
