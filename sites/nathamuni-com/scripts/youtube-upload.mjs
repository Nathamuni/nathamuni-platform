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
  const description = [entry.detailedDescription || entry.title, hashtags, `Originally posted on Instagram: ${entry.instagramUrl}`]
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
