/**
 * Telegram interface for comment → DM rules: a button menu, a video picker with thumbnails,
 * and one card per rule with Pause / Delete. Pure message builders plus one entry point,
 * dmHandle(), that returns an "outbox" for telegram.mjs to send:
 *   { text, buttons?: [[{ t, d }]], photo?: url, album?: [{ url, caption }] }
 * Button data is "dm:<action>[:<arg>]" (Telegram allows 64 bytes).
 */

import {
  esc,
  shortcodeOf,
  loadSettings,
  saveSettings,
  saveRule,
  toggleRule,
  deleteRule,
  advanceDm,
  editRule,
  EDIT_FIELDS,
  flowGet,
  flowPut,
  flowDel,
  newFlow,
  dmLog,
} from './commentdm.mjs'

const SITE = 'https://nathamuni.com'
const PAGE = 5
const b = (t, d) => ({ t, d })
const CANCEL = b('✖️ Cancel', 'dm:cancel')
const MENU_ROW = [b('➕ Create a DM', 'dm:new'), b('🏠 Menu', 'dm:home')]

const code = (v) => shortcodeOf(v.instagramUrl)
const when = (v) => v.publishedAt || v.publishedDate || ''
const short = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s))
const thumbUrl = (v) => (v?.thumbnail ? (v.thumbnail.startsWith('http') ? v.thumbnail : `${SITE}${v.thumbnail}`) : '')
const recent = (videos) => [...(videos || [])].filter((v) => code(v)).sort((a, c) => when(c).localeCompare(when(a)))
const find = (videos, sc) => (videos || []).find((v) => code(v) === sc)

export function homeMsg(settings) {
  const n = settings.rules.length
  const on = settings.enabled !== false
  return {
    text: `<b>💬 Comment → DM</b>\n${on ? '🟢 ON' : '🔴 OFF — nothing is being sent'} · ${n} DM${n === 1 ? '' : 's'} set up\n\nWhat do you want to do?`,
    buttons: [
      [b('➕ Create a DM', 'dm:new')],
      [b(`📋 My DMs (${n})`, 'dm:list')],
      [b(on ? '🔴 Turn ALL OFF' : '🟢 Turn ALL ON', 'dm:g')],
      [b('📜 Recent activity', 'dm:log'), b('✖️ Close', 'dm:close')],
    ],
  }
}

function replyLabel(r) {
  if (r.noReply) return 'none (DM only)'
  return r.publicReplies?.length ? `“${esc(short(r.publicReplies[0], 40))}”` : 'automatic “Check your DM”'
}

export function ruleCards(settings, videos) {
  const on = settings.enabled !== false
  if (!settings.rules.length) return [{ text: 'You have no DMs set up yet.', buttons: [[b('➕ Create a DM', 'dm:new')]] }]
  const out = [{ text: `<b>📋 Your DMs</b> — ${on ? '🟢 ON' : '🔴 ALL OFF (nothing is sent)'}` }]
  settings.rules.slice(0, 10).forEach((r, i) => {
    const v = r.reel ? find(videos, r.reel) : null
    const text = [
      `<b>${i + 1}. ${esc(r.keywords)}</b> — ${r.enabled === false ? '⏸ paused' : '🟢 active'}`,
      `Video: ${v ? esc(short(v.title || r.reel, 50)) : r.reel ? esc(r.reel) : 'every reel and post'}`,
      `DM: “${esc(short(r.dm, 90))}”`,
      `Public reply: ${replyLabel(r)}`,
    ].join('\n')
    const buttons = [[b('✏️ Edit', `dm:e:${r.id}`), b(r.enabled === false ? '▶️ Resume' : '⏸ Pause', `dm:t:${r.id}`), b('🗑 Delete', `dm:x:${r.id}`)]]
    out.push(v && thumbUrl(v) ? { photo: thumbUrl(v), text, buttons } : { text, buttons })
  })
  if (settings.rules.length > 10) out.push({ text: `+${settings.rules.length - 10} more. Send /dm to list them.` })
  out.push({ text: 'What next?', buttons: [MENU_ROW, [b(on ? '🔴 Turn ALL OFF' : '🟢 Turn ALL ON', 'dm:g'), b('📜 Activity', 'dm:log')]] })
  return out
}

export function pickVideo(videos, page = 0) {
  const list = recent(videos)
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const p = Math.min(Math.max(page, 0), pages - 1)
  const slice = list.slice(p * PAGE, p * PAGE + PAGE)
  const album = slice.map((v, i) => ({ url: thumbUrl(v), caption: `${i + 1}. ${short(v.title || code(v), 60)}` })).filter((x) => x.url)
  const lines = slice.map((v, i) => `${i + 1}. ${esc(short(v.title || code(v), 48))} <i>(${esc(when(v).slice(0, 10))})</i>`)
  const rows = []
  if (slice.length) rows.push(slice.map((v, i) => b(String(i + 1), `dm:v:${code(v)}`)))
  const nav = []
  if (p > 0) nav.push(b('⬅ Newer', `dm:pg:${p - 1}`))
  if (p < pages - 1) nav.push(b('Older ➡', `dm:pg:${p + 1}`))
  if (nav.length) rows.push(nav)
  rows.push([b('🌐 All videos', 'dm:all'), b('🔗 Paste a link', 'dm:older')])
  rows.push([CANCEL])
  const text = ['<b>Step 1/4 — Which video?</b>', slice.length ? 'Tap a number, use all videos, or paste the link of an older one.' : 'Paste a reel link, or tap All videos.', '', ...lines].join('\n')
  const out = []
  if (album.length >= 2) out.push({ album })
  out.push({ text, buttons: rows })
  return out
}

function summary(d, videos) {
  const v = d.reelUrl ? find(videos, shortcodeOf(d.reelUrl)) : null
  const where = d.reelUrl ? (v ? esc(short(v.title, 60)) : esc(d.reelUrl)) : 'every reel and post'
  const reply = d.noReply ? 'none (DM only)' : d.publicReplies?.length ? `“${esc(d.publicReplies[0])}”` : 'automatic “Check your DM”'
  return [
    '<b>Ready to save?</b>',
    '',
    `Video: ${where}`,
    `Keyword: <b>${esc(d.keywords)}</b>`,
    `Public reply: ${reply}`,
    `DM:\n${esc(d.dm)}`,
  ].join('\n')
}

export function promptFor(flow, videos) {
  switch (flow.step) {
    case 'reel':
      return pickVideo(videos, 0)
    case 'keywords':
      return [{ text: '<b>Step 2/4 — Keyword</b>\nWhich word should people comment to get the DM?\nSeveral are fine, separated by commas. Example: <code>link, guide</code>', buttons: [[CANCEL]] }]
    case 'dm':
      return [{ text: '<b>Step 3/4 — The DM</b>\nSend the exact message people will receive. Put your link inside it.\n<i>Max 1000 bytes (a Tamil letter counts as 3).</i>', buttons: [[CANCEL]] }]
    case 'reply':
      return [
        {
          text: '<b>Step 4/4 — Public reply</b>\nWhat should I reply under their comment?',
          buttons: [[b('✅ Auto: “Check your DM 📩”', 'dm:rep:auto')], [b('🚫 No public reply', 'dm:rep:none')], [b('✍️ Type my own wording', 'dm:rep:custom')], [CANCEL]],
        },
      ]
    case 'replytext':
      return [{ text: 'Type the wording to reply under their comment:', buttons: [[CANCEL]] }]
    case 'confirm':
      return [{ text: summary(flow.draft, videos), buttons: [[b('💾 Save', 'dm:ok'), CANCEL]] }]
    default:
      return [homeMsg({ enabled: true, rules: [] })]
  }
}

async function startFlow(env, videos) {
  const flow = newFlow()
  await flowPut(env, flow)
  return [{ text: 'Let’s create a DM. You can tap <b>Cancel</b> any time.' }, ...promptFor(flow, await videos())]
}

async function advance(env, flow, input, videos) {
  if (flow.step === 'edit') return applyEdit(env, flow, input)
  const out = advanceDm(flow, input)
  if (out.error) return [{ text: `⚠️ ${out.error}`, buttons: [[CANCEL]] }]
  if (out.cancel) {
    await flowDel(env)
    return [{ text: 'Cancelled. Nothing was saved.', buttons: [MENU_ROW] }]
  }
  if (out.save) {
    await flowDel(env)
    const r = await saveRule(env, out.save)
    if (!r.ok) return [{ text: `⚠️ Could not save: ${esc(r.error)}`, buttons: [MENU_ROW] }]
    return [
      {
        text: `✅ Saved. Anyone who comments <b>${esc(out.save.keywords)}</b> on ${out.save.reelUrl ? 'that video' : 'any video'} now gets your DM${out.save.noReply ? '' : ' and a public reply'}.`,
        buttons: [[b('📋 My DMs', 'dm:list'), b('➕ Another', 'dm:new')]],
      },
    ]
  }
  await flowPut(env, out.flow)
  return promptFor(out.flow, await videos())
}

const FIELD_NAME = { dm: 'DM text', reply: 'public reply', keywords: 'keyword' }

async function applyEdit(env, flow, input) {
  const cur = await loadSettings(env)
  const out = editRule(cur, flow.ruleId, flow.field, input)
  if (out.error) return [{ text: `⚠️ ${out.error}`, buttons: [[CANCEL]] }]
  await flowDel(env)
  const saved = await saveSettings(env, out.settings)
  const r = saved.rules.find((x) => x.id === flow.ruleId)
  const now = flow.field === 'dm' ? r.dm : flow.field === 'keywords' ? r.keywords : r.noReply ? 'no public reply' : r.publicReplies?.[0] || 'automatic “Check your DM”'
  return [
    {
      text: `✅ Updated the ${FIELD_NAME[flow.field]} for <b>${esc(r.keywords)}</b>. Only that changed; it applies to the next comment (DMs and replies already sent stay as they are).\n\nNow: ${esc(now)}`,
      buttons: [[b('📋 My DMs', 'dm:list'), b('✏️ Edit more', `dm:e:${r.id}`)]],
    },
  ]
}

async function editMenu(env, id) {
  const r = (await loadSettings(env)).rules.find((x) => x.id === id)
  if (!r) return [{ text: 'That DM no longer exists.', buttons: [MENU_ROW] }]
  return [
    {
      text: `<b>✏️ Edit: ${esc(r.keywords)}</b>\nWhat do you want to change? Nothing else will be touched.\n\nDM: “${esc(short(r.dm, 120))}”\nPublic reply: ${replyLabel(r)}`,
      buttons: [
        [b('✏️ DM text', `dm:ef:d:${id}`), b('💬 Public reply', `dm:ef:r:${id}`)],
        [b('🔑 Keyword', `dm:ef:k:${id}`), b('⬅️ Back', 'dm:list')],
      ],
    },
  ]
}

async function startEdit(env, code, id) {
  const field = EDIT_FIELDS[code]
  const r = (await loadSettings(env)).rules.find((x) => x.id === id)
  if (!field || !r) return [{ text: 'That DM no longer exists.', buttons: [MENU_ROW] }]
  await flowPut(env, { step: 'edit', field, ruleId: id, draft: {} })
  const ask = {
    dm: `Send the <b>new DM text</b> (max 1000 bytes; a Tamil letter counts as 3).\n\nCurrent:\n${esc(r.dm)}`,
    keywords: `Send the <b>new keyword(s)</b>, separated by commas.\n\nCurrent: ${esc(r.keywords)}`,
    reply: `Send the <b>new public reply</b> wording, or tap a button.\n\nCurrent: ${replyLabel(r)}`,
  }[field]
  const rows = field === 'reply' ? [[b('✅ Auto: “Check your DM 📩”', 'dm:er:auto'), b('🚫 No reply', 'dm:er:none')], [CANCEL]] : [[CANCEL]]
  return [{ text: ask, buttons: rows }]
}

const expired = [{ text: 'That setup expired. Tap below to start again.', buttons: [MENU_ROW] }]

async function onButton(env, data, videos) {
  const [, action, arg, arg2] = data.split(':')
  const settings = async () => loadSettings(env)
  switch (action) {
    case 'home':
      return [homeMsg(await settings())]
    case 'close':
      return []
    case 'new':
      return startFlow(env, videos)
    case 'list':
      return ruleCards(await settings(), await videos())
    case 'cancel':
      await flowDel(env)
      return [{ text: 'Cancelled. Nothing was saved.', buttons: [MENU_ROW] }]
    case 'pg':
      return pickVideo(await videos(), Number(arg) || 0)
    case 'older':
      return [{ text: 'Paste the link of the video (instagram.com/reel/…).', buttons: [[CANCEL]] }]
    case 'g': {
      const s = await settings()
      const next = await saveSettings(env, { ...s, enabled: s.enabled === false })
      return [{ text: next.enabled ? '🟢 Comment → DM is ON.' : '🔴 Comment → DM is OFF. No DMs or replies will be sent.', buttons: [MENU_ROW] }]
    }
    case 't': {
      const s = await settings()
      const r = s.rules.find((x) => x.id === arg)
      if (!r) return [{ text: 'That DM no longer exists.', buttons: [MENU_ROW] }]
      const next = await saveSettings(env, toggleRule(s, arg))
      const paused = next.rules.find((x) => x.id === arg).enabled === false
      return [{ text: `${paused ? '⏸ Paused' : '▶️ Resumed'}: <b>${esc(r.keywords)}</b>`, buttons: [[b('📋 My DMs', 'dm:list'), b('🏠 Menu', 'dm:home')]] }]
    }
    case 'x': {
      const r = (await settings()).rules.find((x) => x.id === arg)
      if (!r) return [{ text: 'That DM no longer exists.', buttons: [MENU_ROW] }]
      return [{ text: `Delete the DM for <b>${esc(r.keywords)}</b>? This cannot be undone.`, buttons: [[b('🗑 Yes, delete', `dm:xy:${arg}`), b('Keep it', 'dm:list')]] }]
    }
    case 'xy': {
      const s = await settings()
      const r = s.rules.find((x) => x.id === arg)
      if (!r) return [{ text: 'Already deleted.', buttons: [MENU_ROW] }]
      await saveSettings(env, deleteRule(s, arg))
      return [{ text: `🗑 Deleted: <b>${esc(r.keywords)}</b>`, buttons: [[b('📋 My DMs', 'dm:list'), b('🏠 Menu', 'dm:home')]] }]
    }
    case 'e':
      return editMenu(env, arg)
    case 'ef':
      return startEdit(env, arg, arg2)
    case 'er': {
      const f = await flowGet(env)
      return f?.step === 'edit' ? applyEdit(env, f, arg) : expired
    }
    case 'log':
      return [{ text: await dmLog(env), buttons: [[b('🏠 Menu', 'dm:home')]] }]
    default:
      break
  }
  // Everything below answers a question in the setup, so it needs a running setup.
  const flow = await flowGet(env)
  if (!flow) return expired
  switch (action) {
    case 'v':
      return advance(env, flow, `https://www.instagram.com/reel/${arg}/`, videos)
    case 'all':
      return advance(env, flow, 'all', videos)
    case 'ok':
      return advance(env, flow, 'yes', videos)
    case 'rep':
      if (arg === 'custom') {
        const next = { ...flow, step: 'replytext' }
        await flowPut(env, next)
        return promptFor(next, await videos())
      }
      return advance(env, flow, arg, videos)
    default:
      return expired
  }
}

/**
 * Entry point for the owner's Telegram messages and button taps. Returns an outbox array, or
 * null when this is not a /dm interaction (so other commands carry on as usual).
 * input: { kind: 'text', text } | { kind: 'button', data }; loadVideos: () => Promise<video[]>.
 */
export async function dmHandle(env, input, loadVideos) {
  const videos = async () => (loadVideos ? (await loadVideos()) || [] : [])
  if (input.kind === 'button') return onButton(env, String(input.data || ''), videos)

  const t = String(input.text || '').trim()
  if (/^\/dm(@\w+)?$/i.test(t)) {
    // Plain /dm shows every saved DM with its Edit / Pause / Delete buttons; the home menu only when there are none.
    const s = await loadSettings(env)
    return s.rules.length ? ruleCards(s, await videos()) : [homeMsg(s)]
  }
  if (/^\/dm(@\w+)?\s+list\s*$/i.test(t)) return ruleCards(await loadSettings(env), await videos())
  if (/^\/dm(@\w+)?\s+(new|add)\s*$/i.test(t)) return startFlow(env, videos)

  const flow = await flowGet(env)
  if (!flow) return null
  if (/^\/cancel(@\w+)?$/i.test(t)) return onButton(env, 'dm:cancel', videos)
  if (t.startsWith('/')) return null // other commands keep working; the setup waits
  return advance(env, flow, t, videos)
}
