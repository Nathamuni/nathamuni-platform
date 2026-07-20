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
    "Self-taught since a childhood where school didn't come easy, now a software developer in Chennai building offline-first AI. I test everything on myself first — six months on 50 thinkers, a solo marathon with no race bib, a back injury I trained back from — before it becomes a video or a line of code.",
  /** Intro paragraphs shown at the top of the about page, beside the portrait. */
  aboutLong: [
    "I'm Nathamuni — twenty-three, from Trichy, Tamil Nadu, now working in Chennai as a software developer on AI-driven, offline-first systems. Off paper: the same kid who found school hard and decided to teach himself everything else instead.",
    "Nothing goes on this site until it survives contact with my own life first — training, habits, the AI I build, the philosophies I test. If it didn't hold up under me, it doesn't get taught to you.",
  ],
  /** Used in metadata + JSON-LD. */
  jobTitle: 'Software Developer & AI Architect',
  metaDescription:
    'Nathamuni: software developer and AI architect, self-taught since childhood, tested on himself first — offline-first AI, calisthenics, and a book built from three years of failure.',

  /**
   * Entity attributes for structured data. These disambiguate Nathamuni the
   * living creator/engineer from the historical Sri Vaishnava saint of the same
   * name — the single biggest lever for branded search. Every value is real.
   */
  fullName: 'Nathamuni S R',
  alternateNames: ['Nathamuni S R', 'Nathamuni SR', 'Nathamuni Nathamuni'],
  homeLocation: 'Chennai, Tamil Nadu, India',
  birthPlace: 'Tiruchirappalli, Tamil Nadu, India',
  nationality: 'Indian',
  alumniOf: 'Saranathan College of Engineering',
  knowsAbout: [
    'Artificial Intelligence',
    'Offline-first AI',
    'On-device machine learning',
    'Calisthenics',
    'Discipline systems',
    'Meditation',
    'Software Engineering',
    'Local-first software',
  ],
  /** External profiles that reinforce the entity (sameAs in JSON-LD). */
  githubUrl: 'https://github.com/Nathamuni',
} as const

export function rolesLine(): string {
  return PROFILE.roles.join(' | ')
}
