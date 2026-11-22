#!/usr/bin/env node
// Daily Instagram report → Telegram. Runs in instagram-sync.yml after the data refresh.
//
//   node scripts/ig-daily-report.mjs            send if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set, else print
//   node scripts/ig-daily-report.mjs --print    print only, never send
//   node scripts/ig-daily-report.mjs --chat-id  list chat ids that messaged the bot (setup helper)
//
// Fail-soft: a Telegram error logs a warning and exits 0 so the sync job stays green.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildReport, renderTelegram, istToday } from './ig-report-core.mjs'
import { renderIdeaTeaser } from './ig-ai-core.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (rel, fallback) => {
  try {
    return JSON.parse(readFileSync(path.join(root, rel), 'utf8'))
  } catch {
    return fallback
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT = process.env.TELEGRAM_CHAT_ID
const args = new Set(process.argv.slice(2))

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`)
  return json.result
}

if (args.has('--chat-id')) {
  if (!TOKEN) {
    console.error('Set TELEGRAM_BOT_TOKEN first, then send any message to your bot.')
    process.exit(1)
  }
  const updates = await tg('getUpdates')
  const chats = new Map()
  for (const u of updates) {
    const c = (u.message ?? u.channel_post ?? u.my_chat_member)?.chat
    if (c) chats.set(c.id, c.username ?? c.title ?? c.first_name)
  }
  if (!chats.size) console.log('No messages yet. Send "hi" to your bot in Telegram, then re-run.')
  for (const [id, name] of chats) console.log(`${id}  ${name}`)
  process.exit(0)
}

const report = buildReport({
  videos: readJson('lib/videos.json', []),
  insights: readJson('lib/insights.json', null),
  history: readJson('lib/insights-history.json', []),
  today: istToday(),
})
const teaser = renderIdeaTeaser(readJson('lib/ideas.json', null))
const text = teaser ? `${renderTelegram(report)}\n\n${teaser}` : renderTelegram(report)

if (args.has('--print') || !TOKEN || !CHAT) {
  if (!args.has('--print')) console.log('(TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — printing instead)\n')
  console.log(text)
  process.exit(0)
}

try {
  await tg('sendMessage', {
    chat_id: CHAT,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  })
  console.log(`Sent daily report (${report.alerts.length} alerts) to Telegram.`)
} catch (err) {
  console.log(`::warning::Daily report not sent: ${err.message}`)
}
