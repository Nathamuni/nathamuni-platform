#!/usr/bin/env node
// Reel transcription job, run by .github/workflows/instagram-transcribe.yml (never locally).
//
//   node scripts/ig-transcribe.mjs prep  <work_dir>   list media, fetch audio for pending reels
//   node scripts/ig-transcribe.mjs merge <work_dir>   fold Whisper results into lib/transcripts.json
//
// prep pages /me/media (50 per call) only until it has TRANSCRIBE_LIMIT pending reels, so the
// daily cost is 1 call and a backfill batch is ~5. Videos are streamed to the runner's temp dir,
// reduced to 16 kHz mono audio with ffmpeg, and the video file is deleted immediately.

import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { igGet, currentUsagePct, USAGE_SOFT_LIMIT } from './ig-fetch.mjs'
import { selectPending, mergeResults } from './ig-transcribe-core.mjs'

const API = 'https://graph.instagram.com/v21.0'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORE = path.join(root, 'lib/transcripts.json')
const LIMIT = Number(process.env.TRANSCRIBE_LIMIT || 60)
const MAX_BYTES = 300 * 1024 * 1024
const [mode, work] = process.argv.slice(2)

if (!work || !['prep', 'merge'].includes(mode)) {
  console.error('usage: ig-transcribe.mjs prep|merge <work_dir>')
  process.exit(2)
}
mkdirSync(work, { recursive: true })
const existing = existsSync(STORE) ? JSON.parse(readFileSync(STORE, 'utf8')) : {}

if (mode === 'prep') {
  const TOKEN = process.env.IG_ACCESS_TOKEN
  if (!TOKEN) {
    console.error('IG_ACCESS_TOKEN not set')
    process.exit(1)
  }
  const media = []
  let url = `${API}/me/media?fields=id,media_type,permalink,media_url,timestamp&limit=50&access_token=${TOKEN}`
  let calls = 0
  while (url) {
    if (calls > 0 && currentUsagePct() >= USAGE_SOFT_LIMIT) {
      console.log(`API usage at ${currentUsagePct()}% — stopping listing early to protect the daily sync.`)
      break
    }
    const page = await igGet(url)
    calls++
    media.push(...(page.data ?? []))
    if (selectPending(media, existing, LIMIT).length >= LIMIT) break
    url = page.paging?.next ?? null
  }
  const pending = selectPending(media, existing, LIMIT)
  console.log(`Listed ${media.length} media in ${calls} call(s); ${pending.length} reel(s) to transcribe.`)

  const manifest = []
  const meta = {}
  for (const m of pending) {
    const mp4 = path.join(work, `${m.shortcode}.mp4`)
    const wav = path.join(work, `${m.shortcode}.wav`)
    try {
      const res = await fetch(m.media_url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > MAX_BYTES) throw new Error(`${(buf.length / 1e6).toFixed(0)}MB too large`)
      writeFileSync(mp4, buf)
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vn', '-ac', '1', '-ar', '16000', wav])
      manifest.push({ shortcode: m.shortcode, wav })
      meta[m.shortcode] = { timestamp: m.timestamp }
    } catch (err) {
      console.log(`skip ${m.shortcode}: ${err.message}`)
    } finally {
      if (existsSync(mp4)) unlinkSync(mp4) // keep audio only; the video never persists
    }
  }
  writeFileSync(path.join(work, 'manifest.json'), JSON.stringify(manifest, null, 2))
  writeFileSync(path.join(work, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log(`Prepared audio for ${manifest.length} reel(s).`)
}

if (mode === 'merge') {
  const resultsPath = path.join(work, 'results.json')
  const results = existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, 'utf8')) : {}
  const meta = existsSync(path.join(work, 'meta.json'))
    ? JSON.parse(readFileSync(path.join(work, 'meta.json'), 'utf8'))
    : {}
  const { transcripts, added } = mergeResults(existing, results, meta, {
    model: process.env.WHISPER_MODEL || 'large-v3-turbo',
    now: new Date().toISOString(),
  })
  writeFileSync(STORE, JSON.stringify(transcripts, null, 2) + '\n')
  const total = Object.keys(transcripts).length
  console.log(`Merged ${added} new transcript(s); ${total} stored.`)
}
