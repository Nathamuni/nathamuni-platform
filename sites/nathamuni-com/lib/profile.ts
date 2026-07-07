/**
 * Single source of truth for who Nathamuni is.
 *
 * Every page (hero, about, metadata, structured data) reads from here —
 * update your bio, roles, or promise in this one file and the whole site
 * follows. No component edits needed.
 */
export const PROFILE = {
  name: 'Nathamuni',
  /** The signature line — hero headline. */
  headline: 'Fear lives in one place only... in your Mind 🗿',
  /** Pipe-separated identity roles, shown under the headline. */
  roles: [
    'Distinguished Engr',
    'Author',
    'Calisthenics',
    'Meditation',
    'Memer',
    'AI Architect',
    'Generalist',
  ],
  /** The mark that prefixes the roles line. */
  mark: '☬',
  /** One-line pitch used in hero + metadata. */
  promise:
    'Videos on discipline, calisthenics, and AI — tested on myself first. No endless scrolling: search them.',
  /** Short intro for the homepage About preview. */
  aboutShort:
    "I turn six months of testing 50 thinkers' life philosophies, calisthenics training, and AI architecture work into short, useful videos — so you don't have to scroll to find the one that matters to you right now.",
  /** Full about-page paragraphs, rendered in order. */
  aboutLong: [
    '☬ Fear lives in one place only... Thats in you Mind🗿',
    'Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect | Generalist',
    "I spent six months putting the core ideas of 50 different thinkers to the test in my own life, and now I share what actually holds up — personal growth, calisthenics training, and the occasional roast of my own DMs — in short videos instead of long threads. This site exists so you can search and find the one that's useful to you right now, instead of scrolling for it.",
  ],
  /** Used in metadata + JSON-LD. */
  jobTitle: 'Distinguished Engineer & AI Architect',
  metaDescription:
    'The organized library of Nathamuni: videos on discipline, calisthenics, and AI — tested on myself first. Search by topic instead of scrolling a feed.',
} as const

export function rolesLine(): string {
  return PROFILE.roles.join(' | ')
}
