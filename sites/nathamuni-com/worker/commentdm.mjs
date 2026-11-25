/**
 * Comment → DM automation for @nathamuni_.
 *
 * Flow: someone comments a keyword on a reel/post → Instagram posts a `comments`
 * webhook to /api/ig/webhook → we match it against the rules saved in KV → we send one
 * Private Reply (a DM tied to that comment) and, optionally, a public reply.
 *
 * Routes (wired in index.mjs):
 *   GET/POST /api/ig/webhook      Meta webhook (verify handshake + signed events)
 *
 * Secrets (wrangler secret put):
 *   IG_ACCESS_TOKEN      Instagram-login token with instagram_business_manage_comments + _manage_messages
 *   IG_APP_SECRET        Meta app secret, used to verify webhook signatures
 *   IG_VERIFY_TOKEN      any random string, pasted into the Meta webhook setup
 *   ADMIN_EMAIL          the only email allowed into the admin page
 *   CF_ACCESS_TEAM_DOMAIN  e.g. yourteam.cloudflareaccess.com
 *   CF_ACCESS_AUD          the Access application's AUD tag
 *
 * Storage (INBOX KV): ig:rules (settings + rules), ig:seen:<commentId> (dedupe, 7 days),
 * ig:log (last 50 events), ig:token (refreshed token, preferred over the secret).
 *
 * Meta limits that shape this file: one private reply per comment, within 7 days; the
 * DM text is capped at 1000 UTF-8 bytes (Tamil is 3 bytes per character).
 */

const GRAPH = 'https://graph.instagram.com/v21.0'
const RULES_KEY = 'ig:rules'
const LOG_KEY = 'ig:log'
const TOKEN_KEY = 'ig:token'
const SEEN_TTL = 7 * 24 * 3600
const LOG_MAX = 50
const MAX_RULES = 50
const MAX_DM_BYTES = 1000
const MAX_PUBLIC_REPLY = 300

// Used when a rule has no wordings of its own: the commenter is always told the DM is on its way.
export const DEFAULT_REPLIES = ['Check your DM 📩', 'Sent you a DM 🙌', 'Just DMed you, check your inbox 📥']

export const DEFAULT_SETTINGS = { enabled: true, rules: [] }

const enc = new TextEncoder()
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

// ── Matching ────────────────────────────────────────────────────────────────

const tokens = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean)

/** True when the keyword appears in the comment as a whole word (or word sequence). */
export function matchesKeyword(comment, keyword) {
  const k = tokens(keyword).join(' ')
  if (!k) return false
  return ` ${tokens(comment).join(' ')} `.includes(` ${k} `)
}

/** Instagram reel/post link → shortcode ("DaczeEJRhpZ"), or "". Handles /<user>/reel/<code> too. */
export function shortcodeOf(url) {
  // "/share/reel/<id>" links carry a different id, not the shortcode, so they are not accepted here.
  const m = String(url || '').match(/instagram\.com\/(?:(?!share\/)[^/\s]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : ''
}

/** Pulls the Instagram link out of whatever was typed ("use it on https://… thanks" → the link). */
export function extractInstagramUrl(text) {
  const m = String(text || '').match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s<>"')]+/i)
  return m ? m[0].replace(/[.,;:!?]+$/, '') : ''
}

/**
 * Enabled rules whose keyword matches, most specific first, so a rule aimed at one reel beats
 * the catch-all. The reel (link) check needs an API lookup, so processComment does that part.
 */
export function matchingRules(settings, text, mediaId) {
  if (!settings || settings.enabled === false) return []
  const hits = []
  for (const rule of settings.rules || []) {
    if (rule.enabled === false) continue
    if (rule.mediaId && rule.mediaId !== String(mediaId)) continue
    if (String(rule.keywords || '').split(',').some((k) => matchesKeyword(text, k))) hits.push(rule)
  }
  const specific = (r) => Number(Boolean(r.reel || r.mediaId))
  return hits.sort((a, b) => specific(b) - specific(a))
}

const pick = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : '')

// ── Validation (admin PUT) ─────────────────────────────────────────────────

export function sanitizeSettings(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.rules)) throw new Error('Invalid settings')
  if (input.rules.length > MAX_RULES) throw new Error(`At most ${MAX_RULES} rules`)
  const rules = input.rules.map((r, i) => {
    const keywords = String(r.keywords ?? '').trim().slice(0, 200)
    const dm = String(r.dm ?? '').trim()
    if (!tokens(keywords).length) throw new Error(`Rule ${i + 1}: add at least one keyword`)
    if (!dm) throw new Error(`Rule ${i + 1}: the DM message is empty`)
    if (enc.encode(dm).length > MAX_DM_BYTES) throw new Error(`Rule ${i + 1}: DM is over ${MAX_DM_BYTES} bytes (Tamil counts 3 per letter)`)
    const publicReplies = (Array.isArray(r.publicReplies) ? r.publicReplies : [])
      .map((x) => String(x).trim().slice(0, MAX_PUBLIC_REPLY))
      .filter(Boolean)
      .slice(0, 8)
    const mediaId = String(r.mediaId ?? '').trim()
    if (mediaId && !/^\d{5,30}$/.test(mediaId)) throw new Error(`Rule ${i + 1}: media ID must be digits only`)
    const raw = String(r.reelUrl ?? '').trim()
    const reelUrl = (extractInstagramUrl(raw) || raw).slice(0, 200)
    const reel = reelUrl ? shortcodeOf(reelUrl) : ''
    if (reelUrl && !reel) throw new Error(`Rule ${i + 1}: that is not an Instagram reel or post link`)
    return {
      id: String(r.id || crypto.randomUUID()).slice(0, 64),
      enabled: r.enabled !== false,
      keywords,
      mediaId,
      reelUrl,
      reel,
      dm,
      publicReplies,
      noReply: r.noReply === true,
    }
  })
  return { enabled: input.enabled !== false, rules }
}

// ── Webhook ────────────────────────────────────────────────────────────────

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function verifySignature(rawBody, header, appSecret) {
  if (!appSecret || !header || !header.startsWith('sha256=')) return false
  const key = await crypto.subtle.importKey('raw', enc.encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const expected = toHex(await crypto.subtle.sign('HMAC', key, enc.encode(rawBody)))
  const got = header.slice(7)
  if (got.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** Flatten a webhook payload into plain comment events (own-account comments dropped). */
export function extractComments(payload) {
  const out = []
  for (const entry of payload?.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'comments') continue
      const v = change.value || {}
      if (!v.id || !v.text) continue
      // Our own replies fire this webhook too — without this check the bot answers itself.
      if (v.from?.id && String(v.from.id) === String(entry.id)) continue
      out.push({
        commentId: String(v.id),
        text: String(v.text),
        mediaId: String(v.media?.id ?? ''),
        userId: String(v.from?.id ?? ''),
        username: String(v.from?.username ?? ''),
        parentId: v.parent_id ? String(v.parent_id) : '',
      })
    }
  }
  return out
}

async function getToken(env) {
  return (await env.INBOX.get(TOKEN_KEY)) || env.IG_ACCESS_TOKEN
}

async function graphPost(env, path, body) {
  const token = await getToken(env)
  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || `Graph ${res.status}`)
  return data
}

async function graphGet(env, path) {
  const res = await fetch(`${GRAPH}${path}`, { headers: { authorization: `Bearer ${await getToken(env)}` } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || `Graph ${res.status}`)
  return data
}

/** Which reel/post a comment is on, as a shortcode. Cached in KV: one lookup per video, ever. */
export async function resolveShortcode(env, mediaId) {
  if (!mediaId) return ''
  const key = `ig:media:${mediaId}`
  const hit = await env.INBOX.get(key)
  if (hit) return hit
  try {
    const sc = shortcodeOf((await graphGet(env, `/${mediaId}?fields=permalink`)).permalink)
    if (sc) await env.INBOX.put(key, sc, { expirationTtl: 30 * 86400 })
    return sc
  } catch (err) {
    console.error('media lookup failed:', err.message)
    return ''
  }
}

/** First sighting of a comment? D1 when bound (100k writes/day free); KV fallback keeps tests and old deploys working. */
async function markSeen(env, commentId, kvKey) {
  if (env.DB) {
    const now = Math.floor(Date.now() / 1000)
    const res = await env.DB.prepare('INSERT OR IGNORE INTO ig_seen (comment_id, at) VALUES (?, ?)').bind(String(commentId), now).run()
    if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM ig_seen WHERE at < ?').bind(now - SEEN_TTL).run().catch(() => {})
    return (res.meta?.changes ?? 0) > 0
  }
  if (await env.INBOX.get(kvKey)) return false
  await env.INBOX.put(kvKey, '1', { expirationTtl: SEEN_TTL })
  return true
}

async function appendLog(env, entry) {
  if (env.DB) {
    const at = new Date().toISOString()
    await env.DB.prepare('INSERT INTO dm_log (at, entry) VALUES (?, ?)').bind(at, JSON.stringify(entry)).run()
    await env.DB.prepare('DELETE FROM dm_log WHERE id <= (SELECT MAX(id) FROM dm_log) - ?').bind(LOG_MAX).run().catch(() => {})
    return
  }
  let log = []
  try {
    log = JSON.parse((await env.INBOX.get(LOG_KEY)) || '[]')
  } catch {
    /* start fresh */
  }
  log.unshift({ at: new Date().toISOString(), ...entry })
  await env.INBOX.put(LOG_KEY, JSON.stringify(log.slice(0, LOG_MAX)))
}

/** Recent events, newest first (D1 when bound, else the KV list). */
async function readLog(env) {
  if (env.DB) {
    const { results } = await env.DB.prepare('SELECT at, entry FROM dm_log ORDER BY id DESC LIMIT ?').bind(LOG_MAX).all()
    return (results ?? []).map((r) => ({ at: r.at, ...JSON.parse(r.entry) }))
  }
  try {
    return JSON.parse((await env.INBOX.get(LOG_KEY)) || '[]')
  } catch {
    return []
  }
}

export async function loadSettings(env) {
  try {
    return JSON.parse((await env.INBOX.get(RULES_KEY)) || 'null') || DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Handle one comment: match, dedupe, DM, then public reply. Never throws. */
export async function processComment(env, c) {
  try {
    if (c.parentId) return // replies inside a thread are not triggers
    let rule = null
    let sc // looked up at most once, and only if a reel-specific rule is in play
    for (const r of matchingRules(await loadSettings(env), c.text, c.mediaId)) {
      if (r.reel) {
        sc ??= await resolveShortcode(env, c.mediaId)
        if (sc !== r.reel) continue
      }
      rule = r
      break
    }
    if (!rule) return
    const seenKey = `ig:seen:${c.commentId}`
    if (!(await markSeen(env, c.commentId, seenKey))) return // Meta retries webhooks

    const entry = { user: c.username, comment: c.text.slice(0, 120), rule: rule.keywords, dm: 'ok', reply: 'off' }
    try {
      await graphPost(env, '/me/messages', { recipient: { comment_id: c.commentId }, message: { text: rule.dm } })
    } catch (err) {
      entry.dm = `failed: ${err.message}`.slice(0, 160)
    }
    // Only say "check your DM" when the DM really went out.
    const wordings = rule.publicReplies?.length ? rule.publicReplies : DEFAULT_REPLIES
    const variant = entry.dm === 'ok' && !rule.noReply ? pick(wordings) : ''
    if (variant) {
      try {
        await graphPost(env, `/${c.commentId}/replies`, { message: variant })
        entry.reply = 'ok'
      } catch (err) {
        entry.reply = `failed: ${err.message}`.slice(0, 160)
      }
    }
    await appendLog(env, entry)
  } catch (err) {
    console.error('comment-dm error:', err.message)
  }
}

export async function handleWebhook(request, env, ctx) {
  if (request.method === 'GET') {
    const u = new URL(request.url).searchParams
    if (env.IG_VERIFY_TOKEN && u.get('hub.mode') === 'subscribe' && u.get('hub.verify_token') === env.IG_VERIFY_TOKEN) {
      return new Response(u.get('hub.challenge') || '', { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const raw = await request.text()
  // IG_APP_SECRET may hold two comma-separated secrets (the Instagram app secret and the Meta
  // app secret): which one signs the webhook depends on the app type, so accept either.
  const sigHeader = request.headers.get('x-hub-signature-256')
  const secrets = String(env.IG_APP_SECRET || '').split(',').map((x) => x.trim()).filter(Boolean)
  let signed = false
  for (const secret of secrets) if (await verifySignature(raw, sigHeader, secret)) signed = true
  if (!signed) {
    return new Response('Bad signature', { status: 401 })
  }
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }
  // Answer Meta at once and do the sending afterwards, or it retries and we double-process.
  const work = Promise.all(extractComments(payload).map((c) => processComment(env, c)))
  if (ctx?.waitUntil) ctx.waitUntil(work)
  else await work
  return new Response('ok', { status: 200 })
}

// ── Token refresh (weekly cron) ────────────────────────────────────────────

/** Long-lived Instagram tokens last 60 days; refresh and keep the new one in KV. */
export async function refreshToken(env) {
  const token = await getToken(env)
  if (!token) return
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)
  const data = await res.json().catch(() => ({}))
  if (res.ok && data.access_token) await env.INBOX.put(TOKEN_KEY, data.access_token)
  else console.error('ig token refresh failed:', data?.error?.message || res.status)
}

// ── Admin gate (Cloudflare Access) ─────────────────────────────────────────

const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0))
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)))

/**
 * Verifies the Cf-Access-Jwt-Assertion header against the team's published keys. The plain
 * email header is not trusted: it could be forged if Access were ever not in front.
 * Returns the email, or null. Fails closed when any setting is missing.
 */
export async function verifyAccess(request, env, fetchImpl = fetch, nowSec = Math.floor(Date.now() / 1000)) {
  const { CF_ACCESS_TEAM_DOMAIN: team, CF_ACCESS_AUD: aud, ADMIN_EMAIL: admin } = env
  const jwt = request.headers.get('cf-access-jwt-assertion')
  if (!team || !aud || !admin || !jwt) return null
  try {
    const [h, p, s] = jwt.split('.')
    const header = b64urlToJson(h)
    const claims = b64urlToJson(p)
    if (header.alg !== 'RS256') return null
    const certs = await (await fetchImpl(`https://${team}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } })).json()
    const jwk = (certs.keys || []).find((k) => k.kid === header.kid)
    if (!jwk) return null
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), enc.encode(`${h}.${p}`))
    if (!ok) return null
    const audOk = Array.isArray(claims.aud) ? claims.aud.includes(aud) : claims.aud === aud
    if (!audOk || claims.iss !== `https://${team}` || !claims.exp || claims.exp < nowSec) return null
    if (String(claims.email || '').toLowerCase() !== String(admin).toLowerCase()) return null
    return claims.email
  } catch {
    return null
  }
}

export async function handleAdminApi(request, env) {
  if (!(await verifyAccess(request, env))) return json({ error: 'Not allowed' }, 403)
  if (request.method === 'GET') {
    return json({ settings: await loadSettings(env), log: await readLog(env) })
  }
  if (request.method === 'PUT') {
    let clean
    try {
      clean = sanitizeSettings(await request.json())
    } catch (err) {
      return json({ error: err.message }, 400)
    }
    await env.INBOX.put(RULES_KEY, JSON.stringify(clean))
    return json({ settings: clean })
  }
  return json({ error: 'Method not allowed' }, 405)
}


// ── Telegram: /dm command (owner chat only; gated in telegram.mjs) ──────────

const esc = (x) => String(x).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])

export const DM_HELP = [
  '<b>💬 Comment → DM</b>',
  '/dm — the menu (create, pause, delete, turn all off)',
  '/dm new — create a DM, step by step',
  '/dm list — your DMs as cards',
  '/cancel — stop a setup',
  '',
  '<i>Typed shortcuts:</i>',
  '/dm add keywords | message | reel link (link optional)',
  'Every comment gets the DM <i>and</i> a public reply (“Check your DM”) automatically.',
  '/dm reply 2 | wording — use your own wording instead (add several)',
  '/dm reply 2 clear — back to the automatic wording',
  '/dm reply 2 none — DM only, no public reply',
  '/dm off 2 · /dm on 2 — switch one rule',
  '/dm off · /dm on — switch everything',
  '/dm del 2 — delete rule 2',
  '/dm log — last 5 events',
  '',
  '<i>One-liner example:</i>',
  '/dm add link, guide | Here is the guide 👉 https://drive.google.com/… | https://www.instagram.com/reel/ABC123/',
].join('\n')

export function renderRules(s) {
  const head = `<b>💬 Comment → DM</b> — ${s.enabled === false ? 'OFF 🔴' : 'ON 🟢'}`
  if (!s.rules.length) return `${head}\n\nNo rules yet. Send /dm new and I will ask you step by step.\n\n${DM_HELP}`
  const lines = [head, '']
  s.rules.forEach((r, i) => {
    const where = r.reel ? `reel ${esc(r.reel)}` : r.mediaId ? `media ${esc(r.mediaId)}` : 'every reel and post'
    const dm = r.dm.length > 70 ? `${r.dm.slice(0, 70)}…` : r.dm
    lines.push(`${i + 1}. <b>${esc(r.keywords)}</b> → ${where}${r.enabled === false ? ' (off)' : ''}`)
    lines.push(`   “${esc(dm)}”`)
    lines.push(`   public reply: ${r.noReply ? 'none (DM only)' : r.publicReplies?.length ? `${r.publicReplies.length} custom wording(s)` : 'automatic “Check your DM”'}`)
  })
  return lines.join('\n').slice(0, 3800)
}

/** Pure: apply one /dm sub-command to the settings. Returns the new settings and the reply. */
export function applyDmCommand(settings, argText) {
  const s = { enabled: settings?.enabled !== false, rules: [...(settings?.rules || [])] }
  const m = String(argText || '').trim().match(/^(\S+)\s*([\s\S]*)$/)
  const sub = (m?.[1] || 'list').toLowerCase()
  const rest = (m?.[2] || '').trim()
  const idx = (x) => {
    const n = Number(x)
    return Number.isInteger(n) && n >= 1 && n <= s.rules.length ? n - 1 : -1
  }
  const fail = (why) => ({ settings: s, changed: false, reply: `⚠️ ${esc(why)}\n\n${DM_HELP}` })
  const ok = (next, reply) => ({ settings: next, changed: true, reply })

  try {
    if (sub === 'list') return { settings: s, changed: false, reply: renderRules(s) }
    if (sub === 'help') return { settings: s, changed: false, reply: DM_HELP }
    if (sub === 'add') {
      const [keywords = '', dm = '', reelUrl = ''] = rest.split('|').map((x) => x.trim())
      const next = sanitizeSettings({ ...s, rules: [...s.rules, { keywords, dm, reelUrl }] })
      const r = next.rules[next.rules.length - 1]
      return ok(next, `✅ Rule ${next.rules.length} added: <b>${esc(r.keywords)}</b> → ${r.reel ? `reel ${esc(r.reel)}` : 'every reel and post'}\nCommenters get the DM and an automatic “Check your DM” reply. Change it with /dm reply ${next.rules.length} | wording`)
    }
    if (sub === 'on' || sub === 'off') {
      if (!rest) return ok(sanitizeSettings({ ...s, enabled: sub === 'on' }), sub === 'on' ? '🟢 Comment → DM is ON.' : '🔴 Comment → DM is OFF. No DMs or replies will be sent.')
      const i = idx(rest)
      if (i < 0) return fail(`There is no rule ${rest}.`)
      s.rules[i] = { ...s.rules[i], enabled: sub === 'on' }
      return ok(sanitizeSettings(s), `Rule ${i + 1} is ${sub === 'on' ? 'on 🟢' : 'off 🔴'}.`)
    }
    if (sub === 'del') {
      const i = idx(rest)
      if (i < 0) return fail(`There is no rule ${rest}.`)
      s.rules.splice(i, 1)
      return ok(sanitizeSettings(s), `🗑 Rule ${i + 1} deleted.`)
    }
    if (sub === 'reply') {
      const i = idx(rest.split(/[\s|]/)[0])
      if (i < 0) return fail('Say which rule, e.g. /dm reply 1 | Sent you a DM!')
      const body = rest.replace(/^\S+\s*\|?\s*/, '').trim()
      if (/^clear$/i.test(body)) {
        s.rules[i] = { ...s.rules[i], publicReplies: [], noReply: false }
        return ok(sanitizeSettings(s), `Rule ${i + 1} uses the automatic “Check your DM” reply.`)
      }
      if (/^none$/i.test(body)) {
        s.rules[i] = { ...s.rules[i], noReply: true }
        return ok(sanitizeSettings(s), `Rule ${i + 1} sends the DM only, with no public reply.`)
      }
      if (!body) return fail('Write the wording after the |.')
      s.rules[i] = { ...s.rules[i], noReply: false, publicReplies: [...(s.rules[i].publicReplies || []), body] }
      const n = sanitizeSettings(s).rules[i].publicReplies.length
      return ok(sanitizeSettings(s), `✅ Rule ${i + 1} now has ${n} public reply wording(s). One is picked at random.`)
    }
  } catch (err) {
    return fail(err.message)
  }
  return fail(`Unknown /dm option "${sub}".`)
}

/** Telegram entry point: load rules, apply the command, save if changed, return the reply. */
/** Last 5 events as Telegram HTML. */
export async function dmLog(env) {
  const log = await readLog(env)
  if (!log.length) return 'No comment → DM events yet.'
  return ['<b>Last events</b>', '', ...log.slice(0, 5).map((e) => `• @${esc(e.user)} — “${esc(e.comment)}” → DM ${esc(e.dm)}, reply ${esc(e.reply)}`)].join('\n').slice(0, 3800)
}

/** Telegram entry point for typed one-liners: load rules, apply the command, save if changed. */
export async function dmCommand(env, argText) {
  if (/^\s*log\b/i.test(argText || '')) return dmLog(env)
  const { settings, reply, changed } = applyDmCommand(await loadSettings(env), argText)
  if (changed) await env.INBOX.put(RULES_KEY, JSON.stringify(settings))
  return reply
}

// ── Telegram: guided setup (state machine; the buttons and messages live in dmui.mjs) ──

const FLOW_KEY = 'tg:dm:flow'
const FLOW_TTL = 1800 // a half-finished setup is forgotten after 30 minutes
const SHARE_MSG = 'That is an Instagram “share” link, which I cannot match to a reel. Open the reel, tap ⋯ → <b>Copy link</b>, and paste that one (it looks like instagram.com/reel/…).'

export { esc }

export async function flowGet(env) {
  try {
    return JSON.parse((await env.INBOX.get(FLOW_KEY)) || 'null')
  } catch {
    return null
  }
}
export const flowPut = (env, flow) => env.INBOX.put(FLOW_KEY, JSON.stringify(flow), { expirationTtl: FLOW_TTL })
export const flowDel = (env) => env.INBOX.delete(FLOW_KEY)
export const newFlow = () => ({ step: 'reel', draft: {} })

export async function saveSettings(env, settings) {
  const clean = sanitizeSettings(settings)
  await env.INBOX.put(RULES_KEY, JSON.stringify(clean))
  return clean
}
export const toggleRule = (s, id) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: r.enabled === false } : r)) })
export const deleteRule = (s, id) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) })

const EDIT_FIELDS = { d: 'dm', r: 'reply', k: 'keywords' }
export { EDIT_FIELDS }

/**
 * Pure: change ONE field of ONE rule, everything else untouched. field: 'dm' | 'reply' | 'keywords'.
 * For 'reply', text 'auto' / 'none' pick the automatic reply or no public reply.
 * Returns { settings } or { error }. The webhook reads rules live, so the change applies to the next comment.
 */
export function editRule(settings, id, field, input) {
  const text = String(input || '').trim()
  const r = (settings.rules || []).find((x) => x.id === id)
  if (!r) return { error: 'That DM no longer exists.' }
  const next = { ...r }
  if (field === 'dm') {
    const n = enc.encode(text).length
    if (!text) return { error: 'The message is empty. Send the new DM text.' }
    if (n > MAX_DM_BYTES) return { error: `That is ${n} bytes and the limit is ${MAX_DM_BYTES} (a Tamil letter counts as 3). Send a shorter message.` }
    next.dm = text
  } else if (field === 'keywords') {
    if (!tokens(text).length) return { error: 'Send at least one word, for example: link' }
    next.keywords = text.slice(0, 200)
  } else if (field === 'reply') {
    if (!text) return { error: 'Send the new wording, or tap a button.' }
    if (/^auto$/i.test(text)) Object.assign(next, { publicReplies: [], noReply: false })
    else if (/^none$/i.test(text)) Object.assign(next, { publicReplies: [], noReply: true })
    else Object.assign(next, { publicReplies: [text.slice(0, MAX_PUBLIC_REPLY)], noReply: false })
  } else return { error: 'Unknown field.' }
  return { settings: { ...settings, rules: settings.rules.map((x) => (x.id === id ? next : x)) } }
}

export async function saveRule(env, draft) {
  try {
    const cur = await loadSettings(env)
    const next = await saveSettings(env, { ...cur, rules: [...(cur.rules || []), draft] })
    return { ok: true, n: next.rules.length }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Pure: one answer moves the setup forward. Order: video → keyword → DM → public reply → confirm.
 * Returns { flow } to continue, { error } to re-ask, { flow: null, save } or { flow: null, cancel }.
 */
export function advanceDm(flow, input) {
  const text = String(input || '').trim()
  const d = { ...flow.draft }
  const err = (error) => ({ flow, error })
  switch (flow.step) {
    case 'reel': {
      const url = extractInstagramUrl(text)
      if (url && shortcodeOf(url)) d.reelUrl = url
      else if (/instagram\.com\/share\//i.test(text)) return err(SHARE_MSG)
      else if (/^(all|any|every)\b/i.test(text)) d.reelUrl = ''
      else return err('I could not find a reel link in that. Tap a video, paste its link (instagram.com/reel/…), or tap <b>All videos</b>.')
      return { flow: { step: 'keywords', draft: d } }
    }
    case 'keywords':
      if (!tokens(text).length) return err('Send at least one word, for example: link')
      d.keywords = text.slice(0, 200)
      return { flow: { step: 'dm', draft: d } }
    case 'dm': {
      const n = enc.encode(text).length
      if (!text) return err('The message is empty. Send the DM text.')
      if (n > MAX_DM_BYTES) return err(`That is ${n} bytes and the limit is ${MAX_DM_BYTES} (a Tamil letter counts as 3). Send a shorter message.`)
      d.dm = text
      return { flow: { step: 'reply', draft: d } }
    }
    case 'reply':
    case 'replytext':
      if (!text) return err('Send the wording, or tap a button.')
      if (flow.step === 'reply' && /^auto$/i.test(text)) Object.assign(d, { publicReplies: [], noReply: false })
      else if (flow.step === 'reply' && /^none$/i.test(text)) Object.assign(d, { publicReplies: [], noReply: true })
      else Object.assign(d, { publicReplies: [text.slice(0, MAX_PUBLIC_REPLY)], noReply: false })
      return { flow: { step: 'confirm', draft: d } }
    case 'confirm':
      if (/^(yes|y|ok|save)$/i.test(text)) return { flow: null, save: d }
      if (/^(no|n|cancel)$/i.test(text)) return { flow: null, cancel: true }
      return err('Tap <b>Save</b> or <b>Cancel</b>.')
    default:
      return { flow: null, cancel: true }
  }
}
