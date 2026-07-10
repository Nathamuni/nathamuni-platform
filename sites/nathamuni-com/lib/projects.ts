/**
 * Case-study data for /projects.
 * Sourced from docs/content-source.md — the sanctioned fact base. Only the
 * projects explicitly cleared for a public write-up are listed here.
 */
export type ProjectStatus = 'live' | 'internal' | 'in-progress' | 'student-era'

export interface Project {
  slug: string
  name: string
  problem: string
  built: string
  stack: string[]
  status: ProjectStatus
  statusLabel: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'brainbox',
    name: 'BrainBox',
    problem: "Most AI apps ship your data to a server you don't control.",
    built:
      'An offline-first AI lifestyle app — on-device LLM chat, personas, habit and routine tracking, journaling, and a gamified wellness engine, all running with zero cloud dependency.',
    stack: ['React Native', 'llama.rn / GGUF', 'Ollama', 'WatermelonDB', 'React Native Skia', 'Computer Vision'],
    status: 'live',
    statusLabel: 'Live on Google Play · early 2026',
  },
  {
    slug: 'research-web-generation-pipeline',
    name: 'Autonomous Research & Web Generation Pipeline',
    problem: 'Competitive research and brand-accurate websites both take days of manual work.',
    built:
      "A pipeline that ingests PDFs and slide decks, runs automated competitive analysis, extracts a brand's type and palette, and generates a brand-accurate website — with LLM providers hot-swapped mid-pipeline.",
    stack: ['FastAPI', 'Pydantic', 'Google LLMs', 'Perplexity SDK', 'Generative UI'],
    status: 'internal',
    statusLabel: 'Production · internal',
  },
  {
    slug: 'android-intent-automation',
    name: 'Android Intent & Automation System',
    problem: "Repetitive phone tasks — settings, messaging, reservations — shouldn't need a human every time.",
    built:
      "Kotlin automation built on Android Accessibility Services: natural-language 'semantic notes' become multi-step routines, plus automated messaging and IRCTC-style reservation navigation.",
    stack: ['Kotlin', 'Android Accessibility Services'],
    status: 'internal',
    statusLabel: 'Personal · internal',
  },
  {
    slug: 'automated-meeting-intelligence',
    name: 'Automated Meeting Intelligence',
    problem: "Meetings produce decisions that die in nobody's notes.",
    built:
      'Gemini-powered diarization and sentiment analysis that turns a recording into an auto-generated PRD and distributes tasks across QA, Dev, and DevOps.',
    stack: ['Gemini API', 'Diarization', 'NLP'],
    status: 'internal',
    statusLabel: 'Work-built · internal',
  },
  {
    slug: 'instauser-understanding',
    name: 'instauser-understanding',
    problem: 'Creators guess at their audience instead of knowing it.',
    built:
      'An AI system that maps audience behavior and archetypes into insights a creator can actually act on.',
    stack: ['Python', 'LLMs', 'Behavioral Modeling'],
    status: 'in-progress',
    statusLabel: 'Private · active',
  },
  {
    slug: 'synergy',
    name: 'Synergy',
    problem: 'College students learn in isolation with no shared platform to collaborate across courses.',
    built:
      'A collaborative learning platform for colleges — pitched live at a Tamil Nadu Startup event, where it won a prize.',
    stack: ['Full-stack Web', 'Startup Pitch'],
    status: 'student-era',
    statusLabel: 'Student era · prize winner',
  },
  {
    slug: 'drug-analysis-system',
    name: 'Drug Analysis System',
    problem: "Reading and comparing molecular structures by hand doesn't scale.",
    built:
      'A SMILES (Simplified Molecular Input Line Entry System) parser and analyzer, built from scratch in .NET.',
    stack: ['.NET', 'C#', 'SMILES Parsing'],
    status: 'student-era',
    statusLabel: 'Student era',
  },
]

export function getProjects(): Project[] {
  return PROJECTS
}
