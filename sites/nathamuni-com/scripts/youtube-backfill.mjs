#!/usr/bin/env node
/**
 * One-off backfill: cross-post the N most recent EXISTING reels to YouTube.
 *
 * The regular daily sync only cross-posts brand-new reels, inline, because
 * Instagram's media_url is a short-lived CDN link only valid while iterating
 * a fresh API response. This script re-fetches that fresh media_url for
 * reels already in videos.json and uploads them the same way. Idempotent:
 * skips anything that already has a youtubeId.
 *
 * Usage: IG_ACCESS_TOKEN=... YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... \
 *        YOUTUBE_REFRESH_TOKEN=... BACKFILL_COUNT=2 node scripts/youtube-backfill.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildVideoMetadata, getYoutubeAccessToken, uploadToYoutube } from './youtube-upload.mjs'

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_JSON = join(SITE_ROOT, 'lib', 'videos.json')
const API = 'https://graph.instagram.com/v21.0'

const TOKEN = process.env.IG_ACCESS_TOKEN
const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YT_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN
const YT_PRIVACY = process.env.YOUTUBE_PRIVACY || 'private'
const COUNT = Number(process.env.BACKFILL_COUNT || 2)
const YT_MAX_BYTES = 300 * 1024 * 1024

for (const [name, val] of Object.entries({ IG_ACCESS_TOKEN: TOKEN, YOUTUBE_CLIENT_ID: YT_CLIENT_ID, YOUTUBE_CLIENT_SECRET: YT_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN: YT_REFRESH_TOKEN })) {
  if (!val) {
    console.error(`${name} is not set`)
    process.exit(1)
  }
}

function shortcodeOf(url) {
  return url.replace(/\/$/, '').split('/').pop().split('?')[0]
}

const videos = JSON.parse(readFileSync(VIDEOS_JSON, 'utf8'))
const reels = videos.filter((v) => (v.mediaType ?? 'reel') === 'reel' && !v.youtubeId)
reels.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
const targets = reels.slice(0, COUNT)

if (targets.length === 0) {
  console.log('Nothing to backfill — every recent reel already has a YouTube upload.')
  process.exit(0)
}
console.log(`Backfilling ${targets.length} reel(s): ${targets.map((t) => t.id).join(', ')}`)

// Fetch fresh media_url for exactly the shortcodes we need.
const targetShortcodes = new Set(targets.map((v) => shortcodeOf(v.instagramUrl)))
const mediaByShortcode = new Map()
let url = `${API}/me/media?fields=id,media_type,permalink,media_url&limit=50&access_token=${TOKEN}`
while (url && mediaByShortcode.size < targetShortcodes.size) {
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    console.error(`Instagram API error: ${data.error.message}`)
    process.exit(1)
  }
  for (const m of data.data) {
    const sc = shortcodeOf(m.permalink)
    if (targetShortcodes.has(sc)) mediaByShortcode.set(sc, m)
  }
  url = data.paging?.next ?? null
}

let uploaded = 0
for (const entry of targets) {
  const sc = shortcodeOf(entry.instagramUrl)
  const media = mediaByShortcode.get(sc)
  if (!media) {
    console.warn(`  skip ${entry.id}: not found in current Instagram media list (older than API pagination reached, or deleted)`)
    entry.youtubeStatus = 'failed'
    continue
  }
  try {
    const mediaRes = await fetch(media.media_url)
    if (!mediaRes.ok) throw new Error(`media_url fetch failed: ${mediaRes.status}`)
    const contentType = mediaRes.headers.get('content-type') || 'video/mp4'
    const buf = Buffer.from(await mediaRes.arrayBuffer())
    if (buf.length > YT_MAX_BYTES) throw new Error(`${(buf.length / 1e6).toFixed(0)}MB exceeds safety cap`)

    const accessToken = await getYoutubeAccessToken({
      clientId: YT_CLIENT_ID,
      clientSecret: YT_CLIENT_SECRET,
      refreshToken: YT_REFRESH_TOKEN,
    })
    const metadata = buildVideoMetadata(entry)
    const youtubeId = await uploadToYoutube({
      accessToken,
      videoBuffer: buf,
      contentType,
      metadata,
      privacyStatus: YT_PRIVACY,
    })
    entry.youtubeId = youtubeId
    entry.youtubeUrl = `https://youtube.com/shorts/${youtubeId}`
    entry.youtubeStatus = YT_PRIVACY
    uploaded++
    console.log(`  + ${entry.id} -> ${entry.youtubeUrl} (requested privacy=${YT_PRIVACY})`)
  } catch (err) {
    entry.youtubeStatus = 'failed'
    console.warn(`  ! ${entry.id} failed: ${err.message}`)
  }
}

writeFileSync(VIDEOS_JSON, JSON.stringify(videos, null, 2) + '\n')
console.log(`Done: ${uploaded}/${targets.length} uploaded.`)
