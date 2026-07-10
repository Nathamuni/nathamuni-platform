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
    "Self-taught since a childhood where school didn't come easy, now a distinguished engineer building offline-first AI. I test everything on myself first — six months on 50 thinkers, a solo marathon with no race bib, a back injury I trained back from — before it becomes a video or a line of code.",
  /** Intro paragraphs shown at the top of the about page, beside the portrait. */
  aboutLong: [
    "I'm Nathamuni — twenty-three, based in Trichy, Tamil Nadu. On paper: a distinguished engineer working on AI-driven, offline-first systems. Off paper: the same kid who found school hard and decided to teach himself everything else instead.",
    "Nothing goes on this site until it survives contact with my own life first — training, habits, the AI I build, the philosophies I test. If it didn't hold up under me, it doesn't get taught to you.",
  ],
  /** Used in metadata + JSON-LD. */
  jobTitle: 'Distinguished Engineer & AI Architect',
  metaDescription:
    'Nathamuni: distinguished engineer and AI architect, self-taught since childhood, tested on himself first — offline-first AI, calisthenics, and a book built from three years of failure.',
} as const

export function rolesLine(): string {
  return PROFILE.roles.join(' | ')
}
