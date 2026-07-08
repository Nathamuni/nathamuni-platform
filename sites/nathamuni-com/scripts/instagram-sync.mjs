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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_JSON = join(SITE_ROOT, 'lib', 'videos.json')
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
      instagramUrl: `https://www.instagram.com/reel/${shortcode}/`,
      thumbnail: `/images/thumbnails/${shortcode}.jpg`,
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
  let url = `${API}/me/media?fields=id,media_type,permalink,caption,thumbnail_url,timestamp&limit=50&access_token=${TOKEN}`
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
const reels = media.filter(
  (m) => m.media_type === 'VIDEO' && m.permalink?.includes('/reel/')
)
console.log(`API media: ${media.length} total, ${reels.length} reels; site library: ${videos.length}`)

const additions = []
for (const m of reels) {
  const shortcode = m.permalink.replace(/\/$/, '').split('/').pop()
  if (knownShortcodes.has(shortcode)) continue
  const { entry } = draftEntry(m, existingIds)
  existingIds.add(entry.id)
  const gotThumb = await downloadThumbnail(m.thumbnail_url, shortcode)
  if (!gotThumb) entry.thumbnail = null
  additions.push(entry)
  console.log(`+ ${entry.publishedDate}  [${entry.category}]  ${entry.title}`)
}

if (additions.length === 0) {
  console.log('Nothing new — library is in sync.')
} else if (DRY_RUN) {
  console.log(`DRY RUN: would add ${additions.length} new reel(s).`)
} else {
  mkdirSync(THUMBS_DIR, { recursive: true })
  writeFileSync(VIDEOS_JSON, JSON.stringify([...videos, ...additions], null, 2) + '\n')
  console.log(`Added ${additions.length} new reel(s) to videos.json.`)
}
