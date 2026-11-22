#!/usr/bin/env node
// Gemini engine for reel transcription (Tamil / English / Tanglish). Runs on the GitHub runner.
//
//   node scripts/ig-transcribe-gemini.mjs <work_dir>
// Reads <work_dir>/manifest.json (from `ig-transcribe.mjs prep`), writes <work_dir>/results.json
// in the same shape as transcribe.py, so `ig-transcribe.mjs merge` works unchanged.
//
// Whisper produced unusable text on this speaker's Tanglish (2026-11-22), hence Gemini.
// Free-tier quota is per Google Cloud project and small, so a daily-quota 429 stops the batch
// cleanly; the remaining reels are picked up on the next run.

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.TRANSCRIBE_MODEL || 'gemini-3.5-flash'
const work = process.argv[2]
if (!KEY || !work) {
  console.error('usage: GEMINI_API_KEY=… ig-transcribe-gemini.mjs <work_dir>')
  process.exit(2)
}

const PROMPT = `You are transcribing an Instagram reel by a young Tamil creator from Tamil Nadu.
He usually speaks Tanglish: Tamil mixed with English words, sometimes pure Tamil or pure English.
Return JSON only.
- speech: false if there is no spoken voice (music or sounds only).
- language: "ta", "en" or "mixed".
- transcript: exactly what he says, in order. Write Tamil words in Tamil script and English words in English letters, as spoken. Do not translate, summarise or invent. Mark unclear parts as [unclear].
- english: a faithful English translation of the whole transcript.
- hook: his first sentence, exactly as spoken (same script rules as transcript).`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    speech: { type: 'BOOLEAN' },
    language: { type: 'STRING', enum: ['ta', 'en', 'mixed'] },
    transcript: { type: 'STRING' },
    english: { type: 'STRING' },
    hook: { type: 'STRING' },
  },
  required: ['speech', 'language', 'transcript', 'english', 'hook'],
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function gemini(audioB64) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: 'audio/mp3', data: audioB64 } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok) return JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}')
    const msg = body.error?.message ?? `HTTP ${res.status}`
    if (res.status === 429 && /per.?day|daily|PerDay/i.test(msg)) {
      const e = new Error(`daily quota reached: ${msg.slice(0, 120)}`)
      e.quota = true
      throw e
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(Math.min(60000, 5000 * 2 ** attempt)) // per-minute limit or overload: wait and retry
      continue
    }
    throw new Error(msg.slice(0, 200))
  }
  throw new Error('gave up after retries')
}

const manifest = JSON.parse(readFileSync(path.join(work, 'manifest.json'), 'utf8'))
const outPath = path.join(work, 'results.json')
const results = {}

for (const { shortcode, wav } of manifest) {
  const mp3 = wav.replace(/\.wav$/, '.mp3')
  const t = Date.now()
  try {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '48k', mp3])
    const r = await gemini(readFileSync(mp3).toString('base64'))
    const text = (r.transcript ?? '').trim()
    results[shortcode] =
      !r.speech || !text
        ? { status: 'no-speech' }
        : { status: 'ok', lang: r.language, text, english: (r.english ?? '').trim(), hook: (r.hook ?? '').trim() }
    console.log(`${shortcode}: ${results[shortcode].status} ${r.language ?? ''} in ${Math.round((Date.now() - t) / 1000)}s`)
  } catch (err) {
    console.log(`${shortcode}: error ${err.message}`)
    if (err.quota) break // leave the rest for tomorrow
    results[shortcode] = { status: 'error', error: err.message }
  } finally {
    try {
      unlinkSync(mp3)
    } catch {}
  }
  writeFileSync(outPath, JSON.stringify(results, null, 2))
  await sleep(4000) // stay well under the free per-minute limit
}
writeFileSync(outPath, JSON.stringify(results, null, 2))
const ok = Object.values(results).filter((r) => r.status !== 'error').length
console.log(`Done: ${ok}/${manifest.length} reels with ${MODEL}.`)
if (manifest.length && ok === 0 && Object.keys(results).length) process.exit(1)
