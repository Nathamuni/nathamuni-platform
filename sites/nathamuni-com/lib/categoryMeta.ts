export interface CategoryMeta {
  hue: number
  icon: string
  tagline: string
}

// Accent hue per category drives chips, tiles, and card glows via CSS vars.
export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Mind & Discipline': {
    hue: 262,
    icon: '🧠',
    tagline: 'Philosophies tested on myself first — systems, discipline, clarity.',
  },
  'Calisthenics & Fitness': {
    hue: 152,
    icon: '💪',
    tagline: 'No gym required. Bodyweight, consistency, and purpose.',
  },
  'AI & Builds': {
    hue: 192,
    icon: '⚡',
    tagline: 'Apps and AI experiments I actually built and shipped.',
  },
  'Humor & Tamil': {
    hue: 38,
    icon: '😉',
    tagline: 'Roasts, memes, and Tamil takes in between the lessons.',
  },
  'Life & Moments': {
    hue: 340,
    icon: '🌊',
    tagline: 'Travel, gratitude, and the days behind the content.',
  },
}

const FALLBACK: CategoryMeta = { hue: 262, icon: '✦', tagline: '' }

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK
}
