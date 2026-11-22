/**
 * Telegram bot webhook (/api/telegram). Runs on Cloudflare, so it answers with the laptop off.
 *
 * Security: Telegram sends the secret we registered with setWebhook in the
 * X-Telegram-Bot-Api-Secret-Token header; anything without it is rejected. Only the
 * owner's chat (TELEGRAM_CHAT_ID) gets answers.
 *
 * Data: the daily sync commits videos/insights/transcripts to the public repo; we read
 * them from raw.githubusercontent.com (cached 10 min), so this never calls Instagram.
 *
 * Secrets (wrangler secret put): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET
 */

import {
  buildReport,
  renderTelegram,
  renderHelp,
  renderBest,
  renderWhen,
  renderGoal,
  renderBoost,
  renderReel,
  renderNext,
  istToday,
} from '../scripts/ig-report-core.mjs'

const RAW = 'https://raw.githubusercontent.com/Nathamuni/nathamuni-platform/main/sites/nathamuni-com/lib'

async function loadJson(name, fallback) {
  try {
    const res = await fetch(`${RAW}/${name}`, { cf: { cacheTtl: 600, cacheEverything: true } })
    return res.ok ? await res.json() : fallback
  } catch {
    return fallback
  }
}

async function loadData() {
  const [videos, insights, history, transcripts] = await Promise.all([
    loadJson('videos.json', []),
    loadJson('insights.json', null),
    loadJson('insights-history.json', []),
    loadJson('transcripts.json', {}),
  ])
  return { videos, insights, history, transcripts }
}

/** Pure: message text + data → reply HTML. Exported for tests. */
export function replyFor(text, data, today) {
  const { videos, insights, history, transcripts } = data
  const [rawCmd, ...rest] = text.trim().split(/\s+/)
  const cmd = rawCmd.toLowerCase().replace(/@\w+$/, '') // "/best@nathamuni_insta_bot" → "/best"
  const arg = rest.join(' ')
  const report = () => buildReport({ videos, insights, history, today })

  switch (cmd) {
    case '/start':
    case '/help':
      return renderHelp()
    case '/today':
      return renderTelegram(report())
    case '/best':
      return renderBest(videos, today, transcripts)
    case '/when':
      return renderWhen(today)
    case '/goal':
      return renderGoal(history)
    case '/boost':
      return renderBoost(report())
    case '/reel':
      return renderReel(videos, arg, transcripts, report().med)
    case '/next':
      return renderNext(report(), videos, today, transcripts)
    default:
      // A pasted reel link → reel details; any other plain message → "what to post next".
      if (/instagram\.com\/(reel|p)\//.test(text)) return renderReel(videos, text, transcripts, report().med)
      if (cmd.startsWith('/')) return `Unknown command.\n\n${renderHelp()}`
      return renderNext(report(), videos, today, transcripts)
  }
}

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
  })
}

export async function handleTelegram(request, env) {
  if (request.method !== 'POST') return new Response('ok')
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (!env.TELEGRAM_WEBHOOK_SECRET || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 })
  }
  const update = await request.json().catch(() => null)
  const msg = update?.message
  // Always 200 so Telegram does not retry; ignore non-text and other people's chats.
  if (!msg?.text) return new Response('ok')
  if (String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) {
    await send(env, msg.chat.id, 'This is a private bot.')
    return new Response('ok')
  }
  try {
    const data = await loadData()
    await send(env, msg.chat.id, replyFor(msg.text, data, istToday()))
  } catch (err) {
    console.error('telegram error:', err.message)
    await send(env, msg.chat.id, 'Something went wrong reading the data. Try again in a minute.')
  }
  return new Response('ok')
}
