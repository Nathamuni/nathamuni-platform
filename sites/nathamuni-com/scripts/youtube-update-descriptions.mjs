#!/usr/bin/env node
/**
 * Patches the description/title/tags on already-uploaded YouTube videos to
 * match the current buildVideoMetadata() output — for when the description
 * template changes after some videos are already live (videos.update, not a
 * re-upload). Idempotent and safe to re-run.
 *
 * Usage: YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=... \
 *        node scripts/youtube-update-descriptions.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildVideoMetadata, getYoutubeAccessToken } from './youtube-upload.mjs'

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VIDEOS_JSON = join(SITE_ROOT, 'lib', 'videos.json')

const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YT_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN
for (const [name, val] of Object.entries({ YOUTUBE_CLIENT_ID: YT_CLIENT_ID, YOUTUBE_CLIENT_SECRET: YT_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN: YT_REFRESH_TOKEN })) {
  if (!val) {
    console.error(`${name} is not set`)
    process.exit(1)
  }
}

const videos = JSON.parse(readFileSync(VIDEOS_JSON, 'utf8'))
const targets = videos.filter((v) => v.youtubeId)
if (targets.length === 0) {
  console.log('No YouTube-uploaded videos to update.')
  process.exit(0)
}

const accessToken = await getYoutubeAccessToken({
  clientId: YT_CLIENT_ID,
  clientSecret: YT_CLIENT_SECRET,
  refreshToken: YT_REFRESH_TOKEN,
})

let updated = 0
for (const entry of targets) {
  const metadata = buildVideoMetadata(entry)
  // videos.update requires the FULL snippet back, including categoryId —
  // fetch the current one first so we don't clobber fields we don't manage.
  const getRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${entry.youtubeId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const getData = await getRes.json()
  const current = getData.items?.[0]?.snippet
  if (!current) {
    console.warn(`  ! ${entry.id}: video ${entry.youtubeId} not found on the channel — skipping`)
    continue
  }

  const putRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: entry.youtubeId,
      snippet: { ...current, ...metadata },
    }),
  })
  if (!putRes.ok) {
    console.warn(`  ! ${entry.id} update failed: ${putRes.status} ${(await putRes.text()).slice(0, 200)}`)
    continue
  }
  updated++
  console.log(`  + updated ${entry.id} (${entry.youtubeUrl})`)
}

console.log(`Done: ${updated}/${targets.length} descriptions updated.`)
