#!/usr/bin/env node
/**
 * Emits public/search-index.json — the compact document set the Worker
 * embeds for semantic search. Runs automatically before every build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const videos = JSON.parse(readFileSync(join(ROOT, 'lib', 'videos.json'), 'utf8'))

const index = videos.map((v) => ({
  id: v.id,
  title: v.title,
  category: v.category,
  tags: v.tags,
  text: v.detailedDescription.slice(0, 600),
}))

writeFileSync(join(ROOT, 'public', 'search-index.json'), JSON.stringify(index))
console.log(`search-index.json: ${index.length} items`)
