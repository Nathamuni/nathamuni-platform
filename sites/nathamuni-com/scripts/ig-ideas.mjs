#!/usr/bin/env node
// Daily AI ideas pack → lib/ideas.json (1 Gemini call/day). Runs in instagram-sync.yml before the report.
// Fail-soft: any error logs a warning and exits 0, so the report still goes out (without ideas).

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { istToday } from './ig-report-core.mjs'
import { accountContext, ideasPrompt, IDEAS_SCHEMA, IDEAS_MODEL } from './ig-ai-core.mjs'
import { geminiJson } from './gemini.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lib = (f) => path.join(root, 'lib', f)
const read = (f, d) => (existsSync(lib(f)) ? JSON.parse(readFileSync(lib(f), 'utf8')) : d)

const today = istToday()
const existing = read('ideas.json', null)
if (existing?.date === today) {
  console.log('Ideas already generated today.')
  process.exit(0)
}
if (!process.env.GEMINI_API_KEY) {
  console.log('::warning::GEMINI_API_KEY not set — skipping ideas.')
  process.exit(0)
}
try {
  const context = accountContext(read('videos.json', []), read('transcripts.json', {}), read('insights-history.json', []), today)
  const out = await geminiJson({
    key: process.env.GEMINI_API_KEY,
    model: IDEAS_MODEL,
    prompt: ideasPrompt(context, today),
    schema: IDEAS_SCHEMA,
  })
  const ideas = (out.ideas ?? []).slice(0, 5)
  if (!ideas.length) throw new Error('no ideas returned')
  writeFileSync(lib('ideas.json'), JSON.stringify({ date: today, model: IDEAS_MODEL, ideas }, null, 2) + '\n')
  console.log(`Wrote ${ideas.length} ideas: ${ideas.map((i) => i.title).join(' | ')}`)
} catch (err) {
  console.log(`::warning::Ideas not generated: ${err.message}`)
}
