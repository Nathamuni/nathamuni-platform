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
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildVideoMetadata, getYoutubeAccessToken, uploadToYoutube } from './youtube-upload.mjs'

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

// YouTube cross-post: fully optional, inert until all three secrets are set.
// Uploads happen inline (not as a separate later script) because Instagram's
// media_url is a short-lived CDN link only valid while we're iterating the
// freshly-fetched API response — it can't be re-fetched from stored data.
const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YT_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN
const YT_ENABLED = Boolean(YT_CLIENT_ID && YT_CLIENT_SECRET && YT_REFRESH_TOKEN)
// New API projects upload videos locked to private until Google's API audit
// passes — flip to 'public'/'unlisted' via this env var once approved.
const YT_PRIVACY = process.env.YOUTUBE_PRIVACY || 'private'
// Quota + runtime guard: ~1600 units per upload against a 10,000/day YouTube
// quota, and each upload holds the whole file in runner memory.
const YT_MAX_PER_RUN = Number(process.env.YOUTUBE_MAX_PER_RUN || 3)
const YT_MAX_BYTES = 300 * 1024 * 1024
console.log(YT_ENABLED ? `YouTube cross-post: enabled (privacy=${YT_PRIVACY})` : 'YouTube cross-post: disabled (secrets not set)')

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

  const kind = media.media_type === 'VIDEO' ? 'Reel' : 'Post'
  const niceDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const title = firstLine.length >= 4 ? (firstLine.length > 70 ? firstLine.slice(0, 67) + '…' : firstLine) : `${kind} · ${niceDate}`
  let slug = slugify(title) || shortcode.toLowerCase()
  let n = 2
  const base = slug
  while (existingIds.has(slug)) slug = `${base}-${n++}`

  const category = guessCategory(caption)
  const hashtags = [...caption.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase()).slice(0, 6)
  const tags = [...new Set([...CAT_TAGS[category], ...hashtags])].slice(0, 8)
  const short = firstLine.length > 0 ? (firstLine.length > 140 ? firstLine.slice(0, 137) + '…' : firstLine) : title

  const entry = {
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
  }
  // Engagement counts are best-effort — only set when the API actually returned them.
  if (typeof media.like_count === 'number') entry.likeCount = media.like_count
  if (typeof media.comments_count === 'number') entry.commentsCount = media.comments_count

  return { entry, shortcode }
}

const BASE_FIELDS = 'id,media_type,permalink,caption,thumbnail_url,media_url,timestamp'
const ENGAGEMENT_FIELDS = 'like_count,comments_count'

function mediaUrl(fields) {
  return `${API}/me/media?fields=${fields}&limit=50&access_token=${TOKEN}`
}

function fatal(error) {
  console.error(`Instagram API error: ${error.message} (code ${error.code})`)
  console.error('If the token expired (60-day lifetime), regenerate it in the Meta dashboard and update the IG_ACCESS_TOKEN secret.')
  process.exit(1)
}

/**
 * Pulls every media item. Tries to include like_count/comments_count; if the
 * API rejects those fields (older API version, permission gap, etc.) it
 * retries once without them so engagement data degrades gracefully instead
 * of blocking the whole sync.
 */
async function fetchAllMedia() {
  let fields = `${BASE_FIELDS},${ENGAGEMENT_FIELDS}`
  let engagementSupported = true

  let res = await fetch(mediaUrl(fields))
  let data = await res.json()
  if (data.error) {
    console.warn(`Engagement fields rejected (${data.error.message}) — retrying without like/comment counts.`)
    engagementSupported = false
    fields = BASE_FIELDS
    res = await fetch(mediaUrl(fields))
    data = await res.json()
  }
  if (data.error) fatal(data.error)

  const items = [...data.data]
  let next = data.paging?.next ?? null
  while (next) {
    const pageRes = await fetch(next)
    const page = await pageRes.json()
    if (page.error) fatal(page.error)
    items.push(...page.data)
    next = page.paging?.next ?? null
  }
  return { items, engagementSupported }
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

const { items: media, engagementSupported } = await fetchAllMedia()
const syncable = media.filter(
  (m) =>
    (m.media_type === 'VIDEO' && m.permalink?.includes('/reel/')) ||
    m.media_type === 'IMAGE' ||
    m.media_type === 'CAROUSEL_ALBUM'
)
console.log(`API media: ${media.length} total, ${syncable.length} syncable; site library: ${videos.length}`)
if (!engagementSupported) console.log('Engagement counts (likes/comments) unavailable this run.')

/**
 * Best-effort cross-post to YouTube for one video entry. Never throws —
 * failures are recorded on the entry itself so the Instagram sync (the part
 * that matters most) is never blocked or broken by a YouTube-side problem.
 */
async function crossPostToYoutube(entry, media) {
  try {
    const mediaRes = await fetch(media.media_url)
    if (!mediaRes.ok) {
      entry.youtubeStatus = 'failed'
      return
    }
    const contentType = mediaRes.headers.get('content-type') || 'video/mp4'
    const buf = Buffer.from(await mediaRes.arrayBuffer())
    if (buf.length > YT_MAX_BYTES) {
      console.warn(`  youtube: skipping ${entry.id} — ${(buf.length / 1e6).toFixed(0)}MB exceeds the safety cap`)
      entry.youtubeStatus = 'skipped-too-large'
      return
    }
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
    console.log(`  youtube: uploaded -> ${entry.youtubeUrl} (${YT_PRIVACY})`)
  } catch (err) {
    console.warn(`  youtube: upload failed for ${entry.id}: ${err.message}`)
    entry.youtubeStatus = 'failed'
  }
}

const additions = []
let ytUploadedThisRun = 0
for (const m of syncable) {
  const shortcode = m.permalink.replace(/\/$/, '').split('/').pop()
  if (knownShortcodes.has(shortcode)) continue
  const { entry } = draftEntry(m, existingIds)
  existingIds.add(entry.id)
  const thumbSource = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url
  const gotThumb = await downloadThumbnail(thumbSource, shortcode)
  if (!gotThumb) entry.thumbnail = null

  if (YT_ENABLED && !DRY_RUN && m.media_type === 'VIDEO' && ytUploadedThisRun < YT_MAX_PER_RUN) {
    await crossPostToYoutube(entry, m)
    if (entry.youtubeId) ytUploadedThisRun++
  }

  additions.push(entry)
  console.log(`+ ${entry.publishedDate}  [${entry.category}]  ${entry.title}`)
}

// Engagement counts drift over time, so existing entries get their
// likeCount/commentsCount refreshed in place — every other hand-edited field
// (title, category, tags, descriptions, ...) is left exactly as-is, matching
// the "never touch existing entries" rule the rest of this script follows.
let engagementUpdated = false
if (engagementSupported) {
  const byShortcode = new Map(
    media.map((m) => [m.permalink.replace(/\/$/, '').split('/').pop(), m])
  )
  for (const v of videos) {
    const shortcode = v.instagramUrl.replace(/\/$/, '').split('/').pop().split('?')[0]
    const m = byShortcode.get(shortcode)
    if (!m) continue
    if (typeof m.like_count === 'number' && v.likeCount !== m.like_count) {
      v.likeCount = m.like_count
      engagementUpdated = true
    }
    if (typeof m.comments_count === 'number' && v.commentsCount !== m.comments_count) {
      v.commentsCount = m.comments_count
      engagementUpdated = true
    }
  }
}

if (additions.length === 0 && !engagementUpdated) {
  console.log('Nothing new — library is in sync.')
} else if (DRY_RUN) {
  console.log(
    `DRY RUN: would add ${additions.length} new item(s)${engagementUpdated ? ' and refresh engagement counts' : ''}.`
  )
} else {
  mkdirSync(THUMBS_DIR, { recursive: true })
  writeFileSync(VIDEOS_JSON, JSON.stringify([...videos, ...additions], null, 2) + '\n')
  console.log(
    `Added ${additions.length} new item(s) to videos.json${engagementUpdated ? '; refreshed engagement counts' : ''}.`
  )
}

// ---- Stories: archive today's active stories before Instagram deletes them ----
// Instagram exposes stories only while live (24h) and never again, so each
// run downloads what's currently up. Requires ffmpeg for compression; falls
// back to storing the original file if unavailable.

function hasFfmpeg() {
  const res = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  return !res.error && res.status === 0
}

/**
 * Runs ffmpeg and only reports success when the process actually exited 0
 * AND the expected output file exists — ffmpeg occasionally exits cleanly
 * without writing a frame (e.g. a bad -ss offset on a very short clip), and
 * that used to slip through silently, leaving stories.json pointing at a
 * poster/video file that was never created. Cleans up any partial output on
 * failure so a later run doesn't mistake it for a real file.
 */
function runFfmpeg(args, outputPath) {
  const res = spawnSync('ffmpeg', args, { stdio: 'ignore' })
  const ok = !res.error && res.status === 0 && existsSync(outputPath)
  if (!ok && existsSync(outputPath)) {
    try {
      unlinkSync(outputPath)
    } catch {
      /* best effort cleanup */
    }
  }
  return ok
}

function encodeStoryVideo(rawPath, outPath) {
  return runFfmpeg(
    ['-nostdin', '-y', '-i', rawPath,
      '-vf', "scale='min(480,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
      '-c:a', 'aac', '-b:a', '80k', '-movflags', '+faststart', outPath],
    outPath
  )
}

function extractPoster(videoPath, posterPath) {
  return runFfmpeg(
    ['-nostdin', '-y', '-ss', '0.5', '-i', videoPath,
      '-vframes', '1', '-update', '1', '-q:v', '5', posterPath],
    posterPath
  )
}

/**
 * Self-healing pass: any archived story whose poster is missing (null, or a
 * path that doesn't actually exist on disk) gets a fresh extraction attempt
 * from its already-archived video, so a one-off ffmpeg hiccup doesn't leave
 * a dead poster forever.
 */
function healMissingPosters(stories, ffmpegAvailable) {
  if (!ffmpegAvailable || DRY_RUN) return { healed: 0, changed: 0 }
  let healed = 0
  let changed = 0
  for (const s of stories) {
    const posterPath = s.poster ? join(SITE_ROOT, 'public', s.poster.replace(/^\//, '')) : null
    if (posterPath && existsSync(posterPath)) continue
    const videoPath = join(SITE_ROOT, 'public', s.video.replace(/^\//, ''))
    if (!existsSync(videoPath)) continue
    const target = join(STORIES_DIR, `${s.id}.jpg`)
    if (extractPoster(videoPath, target)) {
      s.poster = `/stories/${s.id}.jpg`
      healed++
      changed++
      console.log(`healed poster for story ${s.id}`)
    } else if (s.poster !== null) {
      // Was pointing at a dead path — mark it honestly rather than leave a lie.
      s.poster = null
      changed++
    }
  }
  return { healed, changed }
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

  const stories = existsSync(STORIES_JSON) ? JSON.parse(readFileSync(STORIES_JSON, 'utf8')) : []
  const knownStories = new Set(stories.map((s) => s.id))
  const ffmpeg = hasFfmpeg()
  mkdirSync(STORIES_DIR, { recursive: true })

  const { healed, changed: healChanged } = healMissingPosters(stories, ffmpeg)

  if (active.length === 0) {
    console.log('No active stories right now.')
    if (healChanged > 0 && !DRY_RUN) {
      stories.sort((a, b) => b.date.localeCompare(a.date))
      writeFileSync(STORIES_JSON, JSON.stringify(stories, null, 2) + '\n')
      console.log(`Healed ${healed} poster(s).`)
    }
    return
  }

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

    let posterOk = false
    if (ffmpeg) {
      const tmp = join(STORIES_DIR, `${s.id}.tmp.mp4`)
      writeFileSync(tmp, raw)
      const videoOk = encodeStoryVideo(tmp, video)
      if (existsSync(tmp)) unlinkSync(tmp)
      if (videoOk) {
        posterOk = extractPoster(video, poster)
        if (!posterOk) {
          console.warn(`ffmpeg poster extraction failed for story ${s.id} — storing without a poster.`)
        }
      } else {
        console.warn(`ffmpeg video encode failed for story ${s.id} — storing the original file.`)
        writeFileSync(video, raw)
      }
    } else {
      writeFileSync(video, raw)
    }

    stories.push({
      id: s.id,
      date: s.timestamp.slice(0, 10),
      video: `/stories/${s.id}.mp4`,
      poster: posterOk ? `/stories/${s.id}.jpg` : null,
      title: null,
    })
    added++
    console.log(`+ story ${s.timestamp.slice(0, 10)} ${s.id}${posterOk ? '' : ' (no poster)'}`)
  }

  if ((added > 0 || healChanged > 0) && !DRY_RUN) {
    stories.sort((a, b) => b.date.localeCompare(a.date))
    writeFileSync(STORIES_JSON, JSON.stringify(stories, null, 2) + '\n')
    console.log(`Archived ${added} story/stories${healed > 0 ? `, healed ${healed} poster(s)` : ''}.`)
  }
}

await syncStories()
