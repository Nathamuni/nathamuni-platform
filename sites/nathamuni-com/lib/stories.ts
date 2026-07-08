import storiesData from './stories.json'

export interface Story {
  id: string
  date: string
  video: string
  poster: string
  title: string | null
}

export function getAllStories(): Story[] {
  return (storiesData as Story[]).slice().sort((a, b) => b.date.localeCompare(a.date))
}
