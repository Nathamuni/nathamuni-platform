#!/usr/bin/env node
/**
 * ONE-TIME LOCAL HELPER — run this yourself, once, on your own machine.
 * It is never run by CI and never touches the live site.
 *
 * Mints a YouTube upload refresh token for the daily sync to use forever
 * (until you revoke it in your Google Account). Requires a Google Cloud
 * project with the "YouTube Data API v3" enabled and an OAuth 2.0 Client ID
 * of type "Desktop app" (Google Cloud Console → APIs & Services →
 * Credentials → Create Credentials → OAuth client ID → Desktop app).
 *
 * Usage:
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/youtube-get-refresh-token.mjs
 *
 * It opens a tiny localhost server, prints a Google consent URL for you to
 * open in a browser, and once you approve it, prints the refresh token to
 * paste into the repo's GitHub secrets as YOUTUBE_REFRESH_TOKEN (alongside
 * YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET, which are the same values
 * you passed in here).
 */
import { createServer } from 'node:http'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const PORT = 8085
const REDIRECT_URI = `http://localhost:${PORT}/callback`

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first (from your Google Cloud OAuth client).')
  process.exit(1)
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload',
    access_type: 'offline',
    prompt: 'consent',
  })

console.log('\nOpen this URL in a browser signed into the YouTube channel you want to upload to:\n')
console.log(authUrl)
console.log(`\nWaiting for you to approve on http://localhost:${PORT} ...\n`)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }
  const code = url.searchParams.get('code')
  if (!code) {
    res.writeHead(400).end('Missing ?code — did you decline the consent screen?')
    server.close()
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Success — you can close this tab and check the terminal.')
  server.close()

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  })
  const data = await tokenRes.json()
  if (!tokenRes.ok || !data.refresh_token) {
    console.error('Token exchange failed:', data)
    process.exit(1)
  }

  console.log('Success. Add these three as GitHub repo secrets (Settings -> Secrets and variables -> Actions):\n')
  console.log(`  YOUTUBE_CLIENT_ID = ${CLIENT_ID}`)
  console.log(`  YOUTUBE_CLIENT_SECRET = ${CLIENT_SECRET}`)
  console.log(`  YOUTUBE_REFRESH_TOKEN = ${data.refresh_token}\n`)
  console.log('That is the whole setup — the daily sync will start uploading new reels automatically.')
})

server.listen(PORT)
