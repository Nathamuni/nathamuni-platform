#!/usr/bin/env node
/**
 * One-off: seed lib/stories.json from a Meta data export's ig_stories.
 * Transcodes each story to a compact 480w H.264 clip + poster frame in
 * public/stories/. Instagram deletes stories after 24h and offers no API
 * for past ones, so the export is the only source for this backfill;
 * day-to-day accumulation is handled by instagram-sync.mjs.
 *
 * Usage: node scripts/import-export-stories.mjs <export-dir> [more-export-dirs...]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const STORIES_JSON = join(ROOT, 'lib', 'stories.json')
const OUT_DIR = join(ROOT, 'public', 'stories')

const exportDirs = process.argv.slice(2)
if (exportDirs.length === 0) {
  console.error('usage: import-export-stories.mjs <export-dir> [...]')
  process.exit(1)
}

// Meta exports encode UTF-8 bytes as latin-1 in JSON strings.
function fixEncoding(s) {
  try {
    return Buffer.from(s, 'latin1').toString('utf8')
  } catch {
    return s
  }
}

const manifestPath = join(exportDirs[0], 'your_instagram_activity', 'media', 'stories.json')
const items = JSON.parse(readFileSync(manifestPath, 'utf8')).ig_stories

const existing = existsSync(STORIES_JSON) ? JSON.parse(readFileSync(STORIES_JSON, 'utf8')) : []
const known = new Set(existing.map((s) => s.id))
mkdirSync(OUT_DIR, { recursive: true })

const added = []
for (const item of items) {
  const uri = item.uri
  if (!uri?.endsWith('.mp4')) continue
  const id = uri.split('/').pop().replace('.mp4', '')
  if (known.has(id)) continue

  const src = exportDirs.map((d) => join(d, uri)).find((p) => existsSync(p))
  if (!src) {
    console.warn(`missing file for ${id}, skipping`)
    continue
  }

  const video = join(OUT_DIR, `${id}.mp4`)
  const poster = join(OUT_DIR, `${id}.jpg`)
  execFileSync('ffmpeg', ['-nostdin', '-y', '-i', src,
    '-vf', "scale='min(480,iw)':-2", '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '28',
    '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', video],
    { stdio: ['ignore', 'ignore', 'ignore'] })
  execFileSync('ffmpeg', ['-nostdin', '-y', '-ss', '0.5', '-i', video,
    '-vframes', '1', '-update', '1', '-q:v', '5', poster],
    { stdio: ['ignore', 'ignore', 'ignore'] })

  const date = new Date(item.creation_timestamp * 1000).toISOString().slice(0, 10)
  added.push({
    id,
    date,
    video: `/stories/${id}.mp4`,
    poster: `/stories/${id}.jpg`,
    title: fixEncoding(item.title ?? '').trim() || null,
  })
  console.log(`+ ${date} ${id}`)
}

const all = [...existing, ...added].sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(STORIES_JSON, JSON.stringify(all, null, 2) + '\n')
console.log(`stories.json: ${all.length} total (${added.length} added)`)
