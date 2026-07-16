/**
 * YouTube Data API v3 — resumable upload helpers.
 *
 * Auth: refresh-token grant (no browser interaction at sync time — the
 * refresh token is minted once via scripts/youtube-get-refresh-token.mjs
 * and stored as a GitHub secret, same pattern as IG_ACCESS_TOKEN).
 *
 * Inert by design: instagram-sync.mjs only calls into this module when
 * YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET/YOUTUBE_REFRESH_TOKEN are all set.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Single source of truth stays lib/social.ts — parsed here rather than
// duplicated, so the Instagram handle in every video description can never
// drift out of sync with the one shown on the site itself.
const SOCIAL_TS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'social.ts'),
  'utf8'
)
const INSTAGRAM_PROFILE_URL =
  SOCIAL_TS.match(/instagram:\s*'([^']+)'/)?.[1] ?? 'https://www.instagram.com/nathamuni_/'
const INSTAGRAM_HANDLE = `@${INSTAGRAM_PROFILE_URL.replace(/\/$/, '').split('/').pop()}`
// Bare domain form (no https://www, no trailing slash) — still auto-links on
// YouTube, just reads cleaner in the description.
const INSTAGRAM_CLEAN_LINK = INSTAGRAM_PROFILE_URL.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

const CATEGORY_MAP = {
  'Calisthenics & Fitness': '17', // Sports
  'AI & Builds': '28', // Science & Technology
  'Humor & Tamil': '23', // Comedy
  'Mind & Discipline': '22', // People & Blogs
  'Life & Moments': '22', // People & Blogs
}

/** Pure — builds the YouTube snippet from a videos.json entry. Testable without network. */
export function buildVideoMetadata(entry) {
  const title = entry.title.length > 95 ? `${entry.title.slice(0, 92)}...` : entry.title
  const hashtags = (entry.tags ?? [])
    .slice(0, 8)
    .map((t) => `#${t.replace(/\s+/g, '')}`)
    .join(' ')
  const description = [
    entry.detailedDescription || entry.title,
    hashtags,
    `📸 Follow ${INSTAGRAM_HANDLE} on Instagram for the daily reels, behind-the-scenes, and everything before it lands anywhere else:\n${INSTAGRAM_CLEAN_LINK}`,
    `🔗 Watch the original: ${entry.instagramUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 4900)

  return {
    title,
    description,
    tags: (entry.tags ?? []).slice(0, 15),
    categoryId: CATEGORY_MAP[entry.category] ?? '22',
  }
}

export async function getYoutubeAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`token refresh failed: ${data.error_description ?? data.error ?? res.status}`)
  return data.access_token
}

/**
 * Resumable upload in one shot: init session (gets a Location URL), then PUT
 * the whole buffer. Reel-sized files (a few MB to low hundreds of MB) fit
 * comfortably in a GitHub Actions runner's memory — no chunking needed.
 */
export async function uploadToYoutube({ accessToken, videoBuffer, contentType, metadata, privacyStatus }) {
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(videoBuffer.length),
        'X-Upload-Content-Type': contentType,
      },
      body: JSON.stringify({
        snippet: metadata,
        status: { privacyStatus, selfDeclaredMadeForKids: false },
      }),
    }
  )
  if (!initRes.ok) {
    throw new Error(`upload init failed: ${initRes.status} ${await initRes.text()}`)
  }
  const uploadUrl = initRes.headers.get('location')
  if (!uploadUrl) throw new Error('upload init response missing Location header')

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'Content-Length': String(videoBuffer.length) },
    body: videoBuffer,
  })
  const putData = await putRes.json()
  if (!putRes.ok) throw new Error(`upload failed: ${putRes.status} ${JSON.stringify(putData).slice(0, 300)}`)
  return putData.id
}
