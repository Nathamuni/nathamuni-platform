export interface CategoryMeta {
  hue: number
  icon: string
  tagline: string
  /** Owner-generated tile art in public/images/generated/ — omit until the file exists. */
  image?: string
}

// Accent hue per category drives chips, tiles, and card glows via CSS vars.
export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Mind & Discipline': {
    hue: 262,
    icon: '🧠',
    tagline: 'Philosophies tested on myself first — systems, discipline, clarity.',
    image: '/images/generated/cat-mind.jpg',
  },
  'Calisthenics & Fitness': {
    hue: 152,
    icon: '💪',
    tagline: 'No gym required. Bodyweight, consistency, and purpose.',
    image: '/images/generated/cat-fitness.jpg',
  },
  'AI & Builds': {
    hue: 192,
    icon: '⚡',
    tagline: 'Apps and AI experiments I actually built and shipped.',
    image: '/images/generated/cat-ai.jpg',
  },
  'Humor & Tamil': {
    hue: 38,
    icon: '😉',
    tagline: 'Roasts, memes, and Tamil takes in between the lessons.',
    image: '/images/generated/cat-humor.jpg',
  },
  'Life & Moments': {
    hue: 340,
    icon: '🌊',
    tagline: 'Travel, gratitude, and the days behind the content.',
    image: '/images/generated/cat-life.jpg',
  },
}

const FALLBACK: CategoryMeta = { hue: 262, icon: '✦', tagline: '' }

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK
}
