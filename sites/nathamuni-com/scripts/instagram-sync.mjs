#!/usr/bin/env node
/**
 * Instagram → videos.json auto-sync.
 *
 * Pulls the account's media from the Instagram API (Instagram-login token),
 * finds reels not yet in lib/videos.json, downloads their thumbnails, and
 * appends drafted entries (title/category/tags derived from the caption —
 * refine later via the review-Excel loop; nothing existing is modified).
 *
 * Usage:
 *   IG_ACCESS_TOKEN=... node scripts/instagram-sync.mjs [--dry-run]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_JSON = join(SITE_ROOT, 'lib', 'videos.json')
const STORIES_JSON = join(SITE_ROOT, 'lib', 'stories.json')
const STORIES_DIR = join(SITE_ROOT, 'public', 'stories')
const THUMBS_DIR = join(SITE_ROOT, 'public', 'images', 'thumbnails')
const API = 'https://graph.instagram.com/v21.0'

const DRY_RUN = process.argv.includes('--dry-run')
const TOKEN = process.env.IG_ACCESS_TOKEN
if (!TOKEN) {
  console.error('IG_ACCESS_TOKEN is not set')
  process.exit(1)
}

const CATEGORY_RULES = [
  ['Calisthenics & Fitness', ['workout', 'fitness', 'calisthenic', 'gym', 'push-up', 'pushup', 'cardio', 'running', 'physique', 'muscle', 'training', 'kalari']],
  ['AI & Builds', [' ai ', '#ai', 'artificial', 'app ', 'application', 'offline ai', 'local ai', 'tech', 'automation', 'llm', 'testers']],
  ['Mind & Discipline', ['discipline', 'mindset', 'consistency', 'habit', 'system', 'thinkers', 'philosoph', 'motivation', 'responsibility', 'identity', 'transform', 'wisdom', 'intention', 'fear', 'character']],
  ['Humor & Tamil', ['roast', 'meme', 'comedy', 'pavam', 'vro', 'panidunga', 'solradhukku', '😂', '🤣']],
]
const CAT_TAGS = {
  'Mind & Discipline': ['mindset', 'discipline'],
  'Calisthenics & Fitness': ['calisthenics', 'fitness'],
  'AI & Builds': ['ai', 'builds'],
  'Humor & Tamil': ['humor', 'tamil'],
  'Life & Moments': ['life'],
}

function guessCategory(caption) {
  const c = ` ${caption.toLowerCase()} `
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some((k) => c.includes(k))) return category
  }
  return 'Life & Moments'
}

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60)
    .replace(/-$/, '')
}

function draftEntry(media, existingIds) {
  const shortcode = media.permalink.replace(/\/$/, '').split('/').pop()
  const caption = (media.caption ?? '').trim()
  const body = caption
    .replace(/#\w+/g, '')
    .replace(/\n[\s.·]*\n/g, '\n')
    .trim()
  const firstLine = body.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? ''
  const date = media.timestamp.slice(0, 10)

  const title = firstLine.length >= 4 ? (firstLine.length > 70 ? firstLine.slice(0, 67) + '…' : firstLine) : `New reel — ${date}`
  let slug = slugify(title) || shortcode.toLowerCase()
  let n = 2
  const base = slug
  while (existingIds.has(slug)) slug = `${base}-${n++}`

  const category = guessCategory(caption)
  const hashtags = [...caption.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase()).slice(0, 6)
  const tags = [...new Set([...CAT_TAGS[category], ...hashtags])].slice(0, 8)
  const short = firstLine.length > 0 ? (firstLine.length > 140 ? firstLine.slice(0, 137) + '…' : firstLine) : title

  return {
    entry: {
      id: slug,
      title,
      instagramUrl: media.permalink.includes('/reel/')
        ? `https://www.instagram.com/reel/${shortcode}/`
        : `https://www.instagram.com/p/${shortcode}/`,
      thumbnail: `/images/thumbnails/${shortcode}.jpg`,
      mediaType: media.media_type === 'VIDEO' ? 'reel' : 'post',
      category,
      tags,
      shortDescription: short,
      detailedDescription: body || title,
      featured: false,
      publishedDate: date,
    },
    shortcode,
  }
}

async function fetchAllMedia() {
  const items = []
  let url = `${API}/me/media?fields=id,media_type,permalink,caption,thumbnail_url,media_url,timestamp&limit=50&access_token=${TOKEN}`
  while (url) {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.error(`Instagram API error: ${data.error.message} (code ${data.error.code})`)
      console.error('If the token expired (60-day lifetime), regenerate it in the Meta dashboard and update the IG_ACCESS_TOKEN secret.')
      process.exit(1)
    }
    items.push(...data.data)
    url = data.paging?.next ?? null
  }
  return items
}

async function downloadThumbnail(thumbUrl, shortcode) {
  const dest = join(THUMBS_DIR, `${shortcode}.jpg`)
  if (existsSync(dest)) return true
  if (!thumbUrl) return false
  const res = await fetch(thumbUrl)
  if (!res.ok) return false
  const buf = Buffer.from(await res.arrayBuffer())
  if (!DRY_RUN) writeFileSync(dest, buf)
  return true
}

const videos = JSON.parse(readFileSync(VIDEOS_JSON, 'utf8'))
const knownShortcodes = new Set(
  videos.map((v) => v.instagramUrl.replace(/\/$/, '').split('/').pop().split('?')[0])
)
const existingIds = new Set(videos.map((v) => v.id))

const media = await fetchAllMedia()
const syncable = media.filter(
  (m) =>
    (m.media_type === 'VIDEO' && m.permalink?.includes('/reel/')) ||
    m.media_type === 'IMAGE' ||
    m.media_type === 'CAROUSEL_ALBUM'
)
console.log(`API media: ${media.length} total, ${syncable.length} syncable; site library: ${videos.length}`)

const additions = []
for (const m of syncable) {
  const shortcode = m.permalink.replace(/\/$/, '').split('/').pop()
  if (knownShortcodes.has(shortcode)) continue
  const { entry } = draftEntry(m, existingIds)
  existingIds.add(entry.id)
  const thumbSource = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url
  const gotThumb = await downloadThumbnail(thumbSource, shortcode)
  if (!gotThumb) entry.thumbnail = null
  additions.push(entry)
  console.log(`+ ${entry.publishedDate}  [${entry.category}]  ${entry.title}`)
}

if (additions.length === 0) {
  console.log('Nothing new — library is in sync.')
} else if (DRY_RUN) {
  console.log(`DRY RUN: would add ${additions.length} new item(s).`)
} else {
  mkdirSync(THUMBS_DIR, { recursive: true })
  writeFileSync(VIDEOS_JSON, JSON.stringify([...videos, ...additions], null, 2) + '\n')
  console.log(`Added ${additions.length} new item(s) to videos.json.`)
}

// ---- Stories: archive today's active stories before Instagram deletes them ----
// Instagram exposes stories only while live (24h) and never again, so each
// run downloads what's currently up. Requires ffmpeg for compression; falls
// back to storing the original file if unavailable.

function hasFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function syncStories() {
  const res = await fetch(
    `${API}/me/stories?fields=id,media_type,media_url,timestamp&access_token=${TOKEN}`
  )
  const data = await res.json()
  if (data.error) {
    console.warn(`stories fetch failed (non-fatal): ${data.error.message}`)
    return
  }
  const active = (data.data ?? []).filter((s) => s.media_type === 'VIDEO' && s.media_url)
  if (active.length === 0) {
    console.log('No active stories right now.')
    return
  }

  const stories = existsSync(STORIES_JSON) ? JSON.parse(readFileSync(STORIES_JSON, 'utf8')) : []
  const knownStories = new Set(stories.map((s) => s.id))
  const ffmpeg = hasFfmpeg()
  mkdirSync(STORIES_DIR, { recursive: true })
  let added = 0

  for (const s of active) {
    if (knownStories.has(s.id)) continue
    const mediaRes = await fetch(s.media_url)
    if (!mediaRes.ok) continue
    const raw = Buffer.from(await mediaRes.arrayBuffer())
    const video = join(STORIES_DIR, `${s.id}.mp4`)
    const poster = join(STORIES_DIR, `${s.id}.jpg`)
    if (DRY_RUN) {
      console.log(`DRY RUN: would archive story ${s.id}`)
      continue
    }
    if (ffmpeg) {
      const tmp = join(STORIES_DIR, `${s.id}.tmp.mp4`)
      writeFileSync(tmp, raw)
      execFileSync('ffmpeg', ['-nostdin', '-y', '-i', tmp,
        '-vf', "scale='min(480,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
        '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', video], { stdio: 'ignore' })
      execFileSync('ffmpeg', ['-nostdin', '-y', '-ss', '0.5', '-i', video,
        '-vframes', '1', '-update', '1', '-q:v', '5', poster], { stdio: 'ignore' })
      execFileSync('rm', [tmp])
    } else {
      writeFileSync(video, raw)
    }
    stories.push({
      id: s.id,
      date: s.timestamp.slice(0, 10),
      video: `/stories/${s.id}.mp4`,
      poster: `/stories/${s.id}.jpg`,
      title: null,
    })
    added++
    console.log(`+ story ${s.timestamp.slice(0, 10)} ${s.id}`)
  }

  if (added > 0 && !DRY_RUN) {
    stories.sort((a, b) => b.date.localeCompare(a.date))
    writeFileSync(STORIES_JSON, JSON.stringify(stories, null, 2) + '\n')
    console.log(`Archived ${added} story/stories.`)
  }
}

await syncStories()
