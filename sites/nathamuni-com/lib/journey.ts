/**
 * lib/journey.ts — the CMS for /journey.
 *
 * This file IS the content. Edit the arrays below to change what the page
 * shows — no component edits needed. Sourced strictly from
 * docs/content-source.md; do not add anything that isn't verified there.
 */

/** One operating rule — the "why" behind how decisions get made. */
export interface Principle {
  id: string
  title: string
  meaning: string
  /** Optional short note on where the rule comes from. */
  origin?: string
}

export type DecisionHue = 'violet' | 'magenta' | 'cyan'

/**
 * A single "when this happened → I decided → what it led to" node on the
 * decision map. `seq` is the chronological ordering key (not a calendar
 * year — some triggers don't have one) and must increase down the array.
 */
export interface DecisionNode {
  id: string
  seq: number
  /** Display label for when this happened — as precise as it's safe to be. */
  period: string
  trigger: string
  decision: string
  outcome: string
  hue: DecisionHue
}

export type GoalState = 'achieved' | 'in-progress' | 'dream'

/** One entry on the dreams-and-milestones tracker. */
export interface Goal {
  id: string
  title: string
  state: GoalState
  /** Calendar year, only set where the date is confirmed. */
  year?: number
  /** Display label for the date, e.g. "November 2025". */
  dateLabel?: string
  detail?: string
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'tested-on-myself',
    title: 'Tested on myself first',
    meaning: "If it hasn't been tried on my own life, it doesn't make the list.",
  },
  {
    id: 'preparedness-over-prediction',
    title: 'Preparedness over prediction',
    meaning: 'Build for what could happen, not for what I guess will happen.',
  },
  {
    id: 'systems-over-motivation',
    title: 'Systems over motivation',
    meaning: "Motivation runs out. A system doesn't need to feel like it either.",
  },
  {
    id: 'sovereignty-over-convenience',
    title: 'Sovereignty over convenience',
    meaning: 'The convenient option is one tap away. I take the one I control instead.',
    origin: 'Local-first AI, physical books, open source.',
  },
  {
    id: 'generalist-by-design',
    title: 'Generalist by design',
    meaning: 'Depth in many things beats fragility in one.',
  },
  {
    id: 'grow-in-silence',
    title: 'Grow in silence before exhibiting the process',
    meaning: 'The work happens off-camera. Only the output goes public.',
  },
  {
    id: 'yaadhum-oore',
    title: 'Yaadhum oore yaavarum kelir',
    meaning: 'Every town is my town, everyone is my kin.',
    origin: 'யாதும் ஊரே யாவரும் கேளிர் — the Tamil ethos this runs on.',
  },
]

export const DECISIONS: DecisionNode[] = [
  {
    id: 'childhood-self-taught',
    seq: 1,
    period: 'Childhood',
    trigger: "school didn't come easy — ADHD made the conventional path a bad fit.",
    decision: 'teach myself everything else instead: game dev, app dev, frontend, math, hacking, 3D, crafts.',
    outcome: 'hackathon wins, and the first apps in what became sixteen-plus shipped.',
    hue: 'violet',
  },
  {
    id: 'college-calisthenics',
    seq: 2,
    period: '2020',
    trigger: 'college started with no gym and no equipment.',
    decision: 'train with bodyweight alone — calisthenics, nothing but a bar and gravity.',
    outcome: 'the start of an advanced skills progression: levers, handstands, the long climb toward planche.',
    hue: 'magenta',
  },
  {
    id: 'injury-comeback',
    seq: 3,
    period: 'The injury',
    trigger: 'a back injury put me on bed rest for three months — no training at all.',
    decision: 'rebuild from zero. form before load, patience before ambition.',
    outcome: 'a full comeback, capped by a self-organised solo marathon: 26.21 km in 4:38:32, no race, no supporters.',
    hue: 'cyan',
  },
  {
    id: 'meditation-debugging',
    seq: 4,
    period: 'Ongoing',
    trigger: 'noise and overwhelm build up faster than any to-do list can absorb.',
    decision: 'treat meditation, rooted in temple practice, as structural debugging for the human operating system.',
    outcome: 'a daily clarity ritual that keeps the rest of the system honest.',
    hue: 'violet',
  },
  {
    id: 'fifty-thinkers',
    seq: 5,
    period: 'Six months, fifty thinkers',
    trigger: 'too much borrowed advice — everyone had an opinion on how to think.',
    decision: 'self-test roughly fifty thinkers’ philosophies over six months.',
    outcome: 'kept only what produced concrete output — focus while coding, handstand holds, quiet in meditation.',
    hue: 'magenta',
  },
  {
    id: 'local-first-ai',
    seq: 6,
    period: 'Local-first',
    trigger: 'doubts about where cloud AI actually sends everyone’s data.',
    decision: 'go local-first — on-device AI, physical books, open source over convenience.',
    outcome: 'BrainBox, a fully offline AI lifestyle app, live on Google Play in early 2026.',
    hue: 'cyan',
  },
  {
    id: 'wrote-the-book',
    seq: 7,
    period: 'November 2025',
    trigger: 'three years of failures kept piling up, one after another.',
    decision: 'write instead of quitting.',
    outcome: 'The Silence That Haunts — self-authored, physical print, by deliberate choice.',
    hue: 'violet',
  },
  {
    id: 'building-the-platform',
    seq: 8,
    period: '2026',
    trigger: 'the platform needed building.',
    decision: 'work as a software developer in Chennai and build it in the open, on the side.',
    outcome: 'nathamuni.com, live.',
    hue: 'magenta',
  },
]

export const GOALS: Goal[] = [
  {
    id: 'book-published',
    title: 'The Silence That Haunts, published',
    state: 'achieved',
    year: 2025,
    dateLabel: 'November 2025',
    detail: 'Self-authored, physical print by deliberate choice.',
  },
  {
    id: 'brainbox-live',
    title: 'BrainBox live on Google Play',
    state: 'achieved',
    year: 2026,
    dateLabel: 'Early 2026',
    detail: 'A fully offline AI lifestyle app — zero cloud dependency.',
  },
  {
    id: 'solo-marathon',
    title: 'Solo marathon',
    state: 'achieved',
    detail: '26.21 km in 4:38:32 — self-organised, no race, no supporters.',
  },
  {
    id: 'sixteen-apps',
    title: 'Sixteen-plus applications shipped',
    state: 'achieved',
    detail: 'Several live on the Play Store.',
  },
  {
    id: 'platform-live',
    title: 'nathamuni.com, live',
    state: 'achieved',
    year: 2026,
  },
  {
    id: 'planche-progression',
    title: 'Planche progression',
    state: 'in-progress',
    detail: 'Levers and handstands done; the slow climb toward a full planche continues.',
  },
  {
    id: 'gray-man-book',
    title: 'The Gray Man — second book',
    state: 'in-progress',
    detail: 'A technical, behavioral manual on the neurobiology of decision-making, discipline, and cognitive-bias mitigation.',
  },
  {
    id: 'creator-platform-growth',
    title: 'The creator platform, growing',
    state: 'in-progress',
    detail: 'Daily — more of the archive, more of the process, out in the open.',
  },
  {
    id: 'maltese',
    title: 'Maltese',
    state: 'dream',
    detail: 'One of the hardest static elements in calisthenics — still on the list.',
  },
  {
    id: 'conscious-tech',
    title: 'Products that help people grow',
    state: 'dream',
    detail: 'The wider idea BrainBox is a first step toward.',
  },
]

export function getPrinciples(): Principle[] {
  return PRINCIPLES
}

export function getDecisions(): DecisionNode[] {
  return DECISIONS
}

export function getGoals(): Goal[] {
  return GOALS
}
