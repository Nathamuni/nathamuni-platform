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
  renderEvening,
  renderWeekly,
  istToday,
} from '../scripts/ig-report-core.mjs'
import {
  accountContext,
  ratingPrompt,
  renderRating,
  renderIdeas,
  renderIdeaTeaser,
  RATING_SCHEMA,
  RATE_MODEL,
  RATE_DAILY_CAP,
} from '../scripts/ig-ai-core.mjs'
import { geminiJson } from '../scripts/gemini.mjs'
import { dmCommand } from './commentdm.mjs'
import { dmHandle } from './dmui.mjs'

// Cron schedules (UTC) — must match "triggers.crons" in wrangler.jsonc.
export const CRON_MORNING = '30 2 * * *' // 8:00 am IST daily — starts the GitHub sync
export const CRON_EVENING = '15 12 * * *' // 5:45 pm IST daily
export const CRON_WEEKLY = '30 13 * * SUN' // 7:00 pm IST Sunday
const MUTE_KEY = 'tg:muted'

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
  const [videos, insights, history, transcripts, ideas] = await Promise.all([
    loadJson('videos.json', []),
    loadJson('insights.json', null),
    loadJson('insights-history.json', []),
    loadJson('transcripts.json', {}),
    loadJson('ideas.json', null),
  ])
  return { videos, insights, history, transcripts, ideas }
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
      return renderWhen(today, videos)
    case '/goal':
      return renderGoal(history)
    case '/boost':
      return renderBoost(report())
    case '/reel':
      return renderReel(videos, arg, transcripts, report().med)
    case '/next':
      return renderNext(report(), videos, today, transcripts)
    case '/week':
      return renderWeekly(videos, history, today, transcripts)
    case '/ideas':
      return renderIdeas(data.ideas)
    default:
      // A pasted reel link → reel details; any other plain message → "what to post next".
      if (/instagram\.com\/(reel|p)\//.test(text)) return renderReel(videos, text, transcripts, report().med)
      if (cmd.startsWith('/')) return `Unknown command.\n\n${renderHelp()}`
      return renderNext(report(), videos, today, transcripts)
  }
}

/** The "/" menu inside Telegram. Registered by /menu and on every 8 am run so it never goes stale. */
export const MENU_COMMANDS = [
  { command: 'next', description: 'What to post next' },
  { command: 'today', description: 'Today’s report' },
  { command: 'best', description: 'Top 5 reels, last 30 days' },
  { command: 'when', description: 'Best time to post' },
  { command: 'goal', description: 'Pace to 50k' },
  { command: 'boost', description: 'Is anything worth boosting?' },
  { command: 'reel', description: 'Stats for one reel (send the link)' },
  { command: 'week', description: 'Weekly review' },
  { command: 'ideas', description: '5 AI reel ideas' },
  { command: 'idea', description: 'AI rates your idea' },
  { command: 'dm', description: 'Comment → DM: create, pause, delete' },
  { command: 'cancel', description: 'Stop a guided setup' },
  { command: 'mute', description: 'Pause reminders' },
  { command: 'unmute', description: 'Resume reminders' },
  { command: 'help', description: 'All commands' },
]

export async function setMenu(env) {
  if (!env.TELEGRAM_BOT_TOKEN) return false
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ commands: MENU_COMMANDS }),
  })
  return res.ok
}

async function tg(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

const markup = (buttons) =>
  buttons?.length ? { inline_keyboard: buttons.map((row) => row.map((x) => ({ text: x.t, callback_data: x.d }))) } : undefined

/** Send an outbox from dmui.mjs: optional thumbnail album, optional photo card, text with buttons. */
export async function playOutbox(env, chatId, outbox) {
  for (const m of outbox) {
    if (m.album?.length >= 2) {
      // A dead thumbnail link fails the whole album; the numbered text list still works without it.
      await tg(env, 'sendMediaGroup', { chat_id: chatId, media: m.album.map((a) => ({ type: 'photo', media: a.url, caption: a.caption })) }).catch(() => false)
      if (!m.text) continue
    }
    if (m.photo) {
      const ok = await tg(env, 'sendPhoto', { chat_id: chatId, photo: m.photo, caption: m.text, parse_mode: 'HTML', reply_markup: markup(m.buttons) }).catch(() => false)
      if (ok) continue
    }
    if (m.text) {
      await tg(env, 'sendMessage', { chat_id: chatId, text: m.text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, reply_markup: markup(m.buttons) })
    }
  }
}

async function loadVideos() {
  return (await loadData()).videos
}

async function handleCallback(env, cb) {
  await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id }).catch(() => false)
  const chatId = cb.message?.chat?.id
  if (String(chatId) !== String(env.TELEGRAM_CHAT_ID) || !String(cb.data || '').startsWith('dm:')) return
  // Remove the buttons that were tapped so a second tap cannot repeat the action.
  await tg(env, 'editMessageReplyMarkup', { chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => false)
  try {
    const out = await dmHandle(env, { kind: 'button', data: cb.data }, loadVideos)
    if (out) await playOutbox(env, chatId, out)
  } catch (err) {
    console.error('telegram dm button error:', err.message)
    await send(env, chatId, 'Something went wrong. Send /dm to start again.')
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
  if (update?.callback_query) {
    await handleCallback(env, update.callback_query)
    return new Response('ok')
  }
  const msg = update?.message
  // Always 200 so Telegram does not retry; ignore non-text and other people's chats.
  if (!msg?.text) return new Response('ok')
  if (String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) {
    await send(env, msg.chat.id, 'This is a private bot.')
    return new Response('ok')
  }
  try {
    const guided = await dmHandle(env, { kind: 'text', text: msg.text }, loadVideos)
    if (guided !== null) {
      await playOutbox(env, msg.chat.id, guided)
      return new Response('ok')
    }
  } catch (err) {
    console.error('telegram dm error:', err.message)
    await send(env, msg.chat.id, 'Something went wrong with /dm. Try again in a minute.')
    return new Response('ok')
  }
  const cmd = msg.text.trim().split(/\s+/)[0].toLowerCase().replace(/@\w+$/, '')
  if (cmd === '/mute' || cmd === '/unmute') {
    if (cmd === '/mute') await env.INBOX.put(MUTE_KEY, '1')
    else await env.INBOX.delete(MUTE_KEY)
    await send(
      env,
      msg.chat.id,
      cmd === '/mute'
        ? '🔕 Reminders paused (5:45 pm + Sunday review). The 8 am report and commands still work. /unmute to resume.'
        : '🔔 Reminders back on: 5:45 pm posting nudge + Sunday 7 pm review.',
    )
    return new Response('ok')
  }
  if (cmd === '/menu') {
    await send(env, msg.chat.id, (await setMenu(env)) ? '✅ Command menu updated. Close and reopen the chat if the “/” list looks old.' : '⚠️ Could not update the menu.')
    return new Response('ok')
  }
  if (cmd === '/dm') {
    await send(env, msg.chat.id, await dmCommand(env, msg.text.trim().slice(rawCmdLength(msg.text))))
    return new Response('ok')
  }
  if (cmd === '/idea') {
    await send(env, msg.chat.id, await rateIdea(env, msg.text.trim().slice(rawCmdLength(msg.text)).trim()))
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

const rawCmdLength = (text) => text.trim().split(/\s+/)[0].length

/** Live AI rating of the owner's idea, capped per day so the free Gemini quota is never exceeded. */
export async function rateIdea(env, idea) {
  if (idea.length < 4) return 'Send your idea after the command, e.g.\n/idea gym fail compilation with Tamil voiceover'
  if (!env.GEMINI_API_KEY) return 'AI rating is not configured yet.'
  const today = istToday()
  const key = `tg:ai:${today}`
  const used = Number((await env.INBOX.get(key)) ?? 0)
  if (used >= RATE_DAILY_CAP) return `Daily AI limit reached (${RATE_DAILY_CAP}/day, keeps you on the free tier). Resets at midnight.`
  await env.INBOX.put(key, String(used + 1), { expirationTtl: 2 * 86400 })
  try {
    const { videos, history, transcripts } = await loadData()
    const r = await geminiJson({
      key: env.GEMINI_API_KEY,
      model: RATE_MODEL,
      prompt: ratingPrompt(accountContext(videos, transcripts, history, today), idea),
      schema: RATING_SCHEMA,
      temperature: 0.4,
      retries: 1,
    })
    return `${renderRating(r, idea)}\n\n<i>${RATE_DAILY_CAP - used - 1} AI ratings left today</i>`
  } catch (err) {
    console.error('idea rating error:', err.message)
    return err.quota ? 'Gemini’s free daily limit is used up. Try again tomorrow.' : 'AI is busy right now. Try again in a minute.'
  }
}

/** Pure: which scheduled message to send for a cron, or null for none. Exported for tests. */
export function scheduledMessage(cron, data, today) {
  const { videos, insights, history, transcripts } = data
  if (cron === CRON_EVENING) {
    const nudge = renderEvening(buildReport({ videos, insights, history, today }), videos, today, transcripts)
    const teaser = renderIdeaTeaser(data.ideas)
    return nudge && teaser ? `${nudge}\n\n${teaser}` : nudge
  }
  if (cron === CRON_WEEKLY) return renderWeekly(videos, history, today, transcripts)
  return null
}

/**
 * Start the Instagram sync on GitHub (GitHub's own cron ran ~7.5 h late). Needs GH_DISPATCH_TOKEN:
 * a fine-grained PAT limited to this repo with Actions read/write. On failure, tell the owner —
 * the workflow's fallback schedule still runs later in the day.
 */
export async function dispatchSync(env) {
  if (!env.GH_DISPATCH_TOKEN) return console.warn('GH_DISPATCH_TOKEN not set — relying on the fallback schedule')
  const res = await fetch(
    'https://api.github.com/repos/Nathamuni/nathamuni-platform/actions/workflows/instagram-sync.yml/dispatches',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
        accept: 'application/vnd.github+json',
        'user-agent': 'nathamuni-site-worker',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  )
  if (res.status !== 204) {
    console.error('dispatch failed:', res.status, (await res.text()).slice(0, 200))
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      await send(env, env.TELEGRAM_CHAT_ID, `⚠️ Couldn't start the 8 am sync (GitHub said ${res.status}). The GitHub token may have expired; the backup run will still happen later today.`)
    }
  }
}

export async function handleScheduled(controller, env) {
  if (controller.cron === CRON_MORNING) {
    await setMenu(env).catch(() => {})
    return dispatchSync(env)
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return
  if (await env.INBOX.get(MUTE_KEY)) return
  const text = scheduledMessage(controller.cron, await loadData(), istToday())
  if (text) await send(env, env.TELEGRAM_CHAT_ID, text)
}
