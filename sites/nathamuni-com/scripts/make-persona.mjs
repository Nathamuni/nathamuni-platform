#!/usr/bin/env node
/**
 * Emits public/persona.json — the compact fact base the /api/ask Worker
 * grounds the AI twin on. Compiled from the sanctioned fact source plus the
 * site's own content modules, so it never drifts from what's published.
 *
 * Sources (publish-safe only):
 *  - docs/content-source.md — "Publish-safe identity", "The experiments",
 *    and "Voice" sections. The "DO NOT PUBLISH" section is always dropped
 *    wholesale, and the "Projects" / "The book" markdown sections are
 *    skipped in favour of the cleaner, already-vetted lib/projects.ts and
 *    lib/book.ts modules (the markdown versions carry internal editorial
 *    notes not meant for output).
 *  - lib/profile.ts — bio copy
 *  - lib/projects.ts — project summaries
 *  - lib/book.ts — book info
 *  - lib/posts.json — blog titles + excerpts
 *
 * Never invent facts here — this script only reformats what already exists.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Transpile a small, dependency-free lib/*.ts data module and import it. */
async function loadTsModule(relPath) {
  const source = readFileSync(join(ROOT, relPath), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  })
  const dataUri = 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
  return import(dataUri)
}

function cleanText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/\*([^*]+)\*/g, '$1') // italics left over after bold strip
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split a markdown file into { heading, lines }[] on H2 (`## `) boundaries. */
function splitSections(md) {
  const sections = []
  let current = null
  for (const line of md.split('\n')) {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      current = { heading: heading[1].trim(), lines: [] }
      sections.push(current)
      continue
    }
    if (current) current.lines.push(line)
  }
  return sections
}

/**
 * Turn a section's raw lines into discrete text blocks. Bullets/numbered
 * items start a new block; indented continuation lines (the file hard-wraps
 * long bullets) are folded into the block they follow. Blank lines also
 * close the current block, so lead-in paragraphs become their own item.
 */
function extractBlocks(lines) {
  const blocks = []
  let buf = ''
  const flush = () => {
    if (buf.trim()) blocks.push(cleanText(buf))
    buf = ''
  }
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '')
    if (/^\s*(-|\d+\.)\s+/.test(line)) {
      flush()
      buf = line.replace(/^\s*(-|\d+\.)\s+/, '')
    } else if (line.trim() === '') {
      flush()
    } else {
      buf += (buf ? ' ' : '') + line.trim()
    }
  }
  flush()
  return blocks
}

function buildFromContentSource() {
  const md = readFileSync(join(ROOT, 'docs', 'content-source.md'), 'utf8')
  const sections = splitSections(md)
  const KEEP = {
    'Publish-safe identity': 'identity',
    'The experiments (his proof-of-work)': 'experiments',
    Voice: 'voice',
  }
  const topics = { identity: [], experiments: [] }
  const voice = []
  for (const section of sections) {
    const key = KEEP[section.heading]
    if (!key) continue // drops "Projects", "The book", and DO NOT PUBLISH
    const blocks = extractBlocks(section.lines)
    if (key === 'voice') voice.push(...blocks)
    else topics[key].push(...blocks)
  }
  return { topics, voice }
}

async function buildFromProfile() {
  const { PROFILE } = await loadTsModule('lib/profile.ts')
  const facts = [
    `Identity line: ${PROFILE.headline} — ${PROFILE.roles.join(' | ')}.`,
    PROFILE.aboutShort,
    ...PROFILE.aboutLong,
    `One-line promise: ${PROFILE.promise}`,
    `Job title: ${PROFILE.jobTitle}.`,
  ]
  return facts.map(cleanText)
}

async function buildFromProjects() {
  const { PROJECTS } = await loadTsModule('lib/projects.ts')
  const topicsProjects = PROJECTS.map((p) => ({
    name: p.name,
    problem: p.problem,
    built: p.built,
    status: p.statusLabel,
  }))
  const facts = PROJECTS.map((p) =>
    cleanText(`${p.name} — problem: ${p.problem} Built: ${p.built} Status: ${p.statusLabel}.`)
  )
  return { facts, topicsProjects }
}

async function buildFromBook() {
  const { BOOK } = await loadTsModule('lib/book.ts')
  const topicsBook = {
    title: BOOK.title,
    tagline: BOOK.tagline,
    corePrinciple: BOOK.corePrinciple,
    audience: BOOK.audience,
    quotes: BOOK.quotes.slice(0, 3),
  }
  const facts = [
    `Book: "${BOOK.title}" by ${BOOK.author} (${BOOK.edition}). Tagline: "${BOOK.tagline}"`,
    `Book core principle: ${BOOK.corePrinciple}`,
    BOOK.pitch,
    BOOK.promise,
  ].map(cleanText)
  return { facts, topicsBook }
}

function buildFromPosts() {
  const posts = JSON.parse(readFileSync(join(ROOT, 'lib', 'posts.json'), 'utf8'))
  const topicsBlog = posts.map((p) => ({ title: p.title, excerpt: p.excerpt }))
  const facts = posts.map((p) => cleanText(`Blog post "${p.title}" — ${p.excerpt}`))
  return { facts, topicsBlog }
}

async function main() {
  const fromContentSource = buildFromContentSource()
  const profileFacts = await buildFromProfile()
  const { facts: projectFacts, topicsProjects } = await buildFromProjects()
  const { facts: bookFacts, topicsBook } = await buildFromBook()
  const { facts: blogFacts, topicsBlog } = buildFromPosts()

  const persona = {
    facts: [
      ...fromContentSource.topics.identity,
      ...fromContentSource.topics.experiments,
      ...profileFacts,
      ...projectFacts,
      ...bookFacts,
      ...blogFacts,
    ],
    voice: fromContentSource.voice,
    topics: {
      identity: fromContentSource.topics.identity,
      experiments: fromContentSource.topics.experiments,
      projects: topicsProjects,
      book: topicsBook,
      blog: topicsBlog,
    },
  }

  const json = JSON.stringify(persona)
  const bytes = Buffer.byteLength(json, 'utf8')
  writeFileSync(join(ROOT, 'public', 'persona.json'), json)
  console.log(`persona.json: ${persona.facts.length} facts, ${(bytes / 1024).toFixed(1)}KB`)
  if (bytes > 24 * 1024) {
    console.warn(`WARNING: persona.json is ${(bytes / 1024).toFixed(1)}KB — over the 24KB budget`)
  }
}

main()
