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
const posts = JSON.parse(readFileSync(join(ROOT, 'lib', 'posts.json'), 'utf8'))

const videoDocs = videos.map((v) => ({
  id: v.id,
  type: 'video',
  title: v.title,
  category: v.category,
  tags: v.tags,
  text: v.detailedDescription.slice(0, 600),
}))

/**
 * Blog posts were absent from the index, so /api/ask could only ever answer from
 * 600-char video captions — the long-form writing was invisible to it. Post bodies
 * are the richest prose on the site, so they get a larger slice.
 *
 * `type` distinguishes the two: /api/search results are matched against video ids by
 * VideoExplorer, which simply ignores anything it cannot resolve, so posts surface in
 * Ask without disturbing video search.
 */
const postDocs = posts.map((p) => ({
  id: p.slug,
  type: 'post',
  title: p.title,
  category: p.category,
  tags: p.tags ?? [],
  text: `${p.excerpt ?? ''}\n${p.body ?? ''}`.slice(0, 1200),
}))

const index = [...videoDocs, ...postDocs]

writeFileSync(join(ROOT, 'public', 'search-index.json'), JSON.stringify(index))
console.log(
  `search-index.json: ${index.length} items (${videoDocs.length} videos, ${postDocs.length} posts)`
)
