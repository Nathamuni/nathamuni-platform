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
    "Self-taught since a childhood where school didn't come easy. Since November 2026 I work independently as an AI researcher, consultant and advisor — studying how expert systems and AI can run inside small and mid-sized businesses without handing their data away. I test everything on myself first, before it becomes a video, a client recommendation or a line of code.",
  /** Intro paragraphs shown at the top of the about page, beside the portrait. */
  aboutLong: [
    "I'm Nathamuni — twenty-four, from Trichy, Tamil Nadu. Since November 2026 I've worked for myself: an AI researcher studying expert systems and AI for SMEs, an AI advisor to the people deciding where to use it, and a freelancer who builds what the research points to. Before that, nearly two years as a software engineer building AI-driven, offline-first systems.",
    "Off paper: the same kid who found school hard and decided to teach himself everything else instead. Nothing goes on this site, or into a recommendation, until it survives contact with my own life first. If it didn't hold up under me, it doesn't get taught to you.",
  ],
  /** "Now" status block — what Nathamuni is doing at present. Refresh when it changes. */
  now: {
    since: 'November 2026',
    heading: 'Now',
    roles: ['AI Researcher', 'AI Advisor', 'Consultant', 'Freelancer'],
    summary:
      'Researching how expert systems and AI work for SMEs, advising owners on where AI is worth it (and where it is not), and taking on freelance builds.',
  },
  /** Used in metadata + JSON-LD. */
  jobTitle: 'AI Researcher, Consultant & Advisor',
  metaDescription:
    'Nathamuni: AI researcher, consultant and advisor for SMEs, researching expert systems and offline-first AI — self-taught since childhood, tested on himself first, author of The Silence That Haunts.',

  /**
   * Entity attributes for structured data. These disambiguate Nathamuni the
   * living creator/engineer from the historical Sri Vaishnava saint of the same
   * name — the single biggest lever for branded search. Every value is real.
   */
  fullName: 'Nathamuni S R',
  alternateNames: ['Nathamuni S R', 'Nathamuni SR', 'Nathamuni Nathamuni'],
  homeLocation: 'India',
  birthPlace: 'Tiruchirappalli, Tamil Nadu, India',
  nationality: 'Indian',
  alumniOf: 'Saranathan College of Engineering',
  knowsAbout: [
    'Artificial Intelligence',
    'Expert systems',
    'AI for small and mid-sized businesses',
    'AI consulting',
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
