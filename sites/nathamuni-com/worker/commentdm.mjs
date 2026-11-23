/**
 * Comment → DM automation for @nathamuni_.
 *
 * Flow: someone comments a keyword on a reel/post → Instagram posts a `comments`
 * webhook to /api/ig/webhook → we match it against the rules saved in KV → we send one
 * Private Reply (a DM tied to that comment) and, optionally, a public reply.
 *
 * Routes (wired in index.mjs):
 *   GET/POST /api/ig/webhook      Meta webhook (verify handshake + signed events)
 *   GET/PUT  /api/admin/ig-rules  rules editor API   ┐ both gated by Cloudflare Access;
 *   GET      /admin/comment-dm    rules editor page  ┘ fail closed if Access is not configured
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

/** First enabled rule whose keyword matches and whose media filter (if any) fits. */
export function findRule(settings, text, mediaId) {
  if (!settings || settings.enabled === false) return null
  for (const rule of settings.rules || []) {
    if (rule.enabled === false) continue
    if (rule.mediaId && rule.mediaId !== String(mediaId)) continue
    const keywords = String(rule.keywords || '').split(',')
    if (keywords.some((k) => matchesKeyword(text, k))) return rule
  }
  return null
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
    return {
      id: String(r.id || crypto.randomUUID()).slice(0, 64),
      enabled: r.enabled !== false,
      keywords,
      mediaId,
      dm,
      publicReplies,
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

async function appendLog(env, entry) {
  let log = []
  try {
    log = JSON.parse((await env.INBOX.get(LOG_KEY)) || '[]')
  } catch {
    /* start fresh */
  }
  log.unshift({ at: new Date().toISOString(), ...entry })
  await env.INBOX.put(LOG_KEY, JSON.stringify(log.slice(0, LOG_MAX)))
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
    const rule = findRule(await loadSettings(env), c.text, c.mediaId)
    if (!rule) return
    const seenKey = `ig:seen:${c.commentId}`
    if (await env.INBOX.get(seenKey)) return // Meta retries webhooks
    await env.INBOX.put(seenKey, '1', { expirationTtl: SEEN_TTL })

    const entry = { user: c.username, comment: c.text.slice(0, 120), rule: rule.keywords, dm: 'ok', reply: 'off' }
    try {
      await graphPost(env, '/me/messages', { recipient: { comment_id: c.commentId }, message: { text: rule.dm } })
    } catch (err) {
      entry.dm = `failed: ${err.message}`.slice(0, 160)
    }
    const variant = pick(rule.publicReplies || [])
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
    let log = []
    try {
      log = JSON.parse((await env.INBOX.get(LOG_KEY)) || '[]')
    } catch {
      /* empty */
    }
    return json({ settings: await loadSettings(env), log })
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

export async function handleAdminPage(request, env) {
  if (!(await verifyAccess(request, env))) return new Response('Not allowed', { status: 403 })
  return new Response(ADMIN_HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
    },
  })
}

const ADMIN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Comment → DM rules</title>
<style>
:root{--bg:#faf8f4;--ink:#1d1b18;--mute:#6b665e;--line:#e4dfd6;--card:#fff;--accent:#1f5f4a;--bad:#a3261b}
@media(prefers-color-scheme:dark){:root{--bg:#161513;--ink:#eee9e0;--mute:#9a948a;--line:#34312c;--card:#1f1d1a;--accent:#6fcfa8;--bad:#ff8a7e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif;padding:16px}
main{max-width:760px;margin:0 auto}h1{font-size:1.4rem;margin:.2em 0}p.s{color:var(--mute);margin:.2em 0 1em}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px;margin:12px 0}
label{display:block;font-size:.85rem;color:var(--mute);margin:10px 0 3px}
input[type=text],textarea{width:100%;font:inherit;color:inherit;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px}
textarea{min-height:90px}button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:8px;padding:8px 14px;cursor:pointer}
button.p{background:var(--accent);color:var(--bg);border-color:var(--accent)}button.d{color:var(--bad)}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.bytes{font-size:.8rem;color:var(--mute)}.bytes.over{color:var(--bad)}
#msg{min-height:1.4em}#msg.err{color:var(--bad)}table{width:100%;border-collapse:collapse;font-size:.85rem}td,th{text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top}
</style></head><body><main>
<h1>Comment → DM rules</h1>
<p class="s">When a comment contains a keyword, the person gets one DM and (optionally) a public reply. Keywords match whole words, any case.</p>
<div class="row"><label style="margin:0"><input type="checkbox" id="on"> Automation on</label></div>
<div id="rules"></div>
<div class="row"><button id="add">+ Add rule</button><button class="p" id="save">Save</button><span id="msg"></span></div>
<h2 style="font-size:1.05rem;margin-top:28px">Recent activity</h2>
<div class="card"><table><thead><tr><th>When</th><th>User</th><th>Rule</th><th>DM</th><th>Reply</th></tr></thead><tbody id="log"></tbody></table></div>
<script>
const $=(i)=>document.getElementById(i);let settings={enabled:true,rules:[]};
const bytes=(s)=>new TextEncoder().encode(s).length;
function msg(t,err){const m=$('msg');m.textContent=t;m.className=err?'err':''}
function field(label,el){const l=document.createElement('label');l.textContent=label;l.appendChild(el);return l}
function render(){
  $('on').checked=settings.enabled;const box=$('rules');box.textContent='';
  settings.rules.forEach((r,i)=>{
    const c=document.createElement('div');c.className='card';
    const kw=document.createElement('input');kw.type='text';kw.value=r.keywords;kw.placeholder='link, guide';kw.oninput=()=>r.keywords=kw.value;
    const dm=document.createElement('textarea');dm.value=r.dm;dm.placeholder='Here is the link: https://…';
    const by=document.createElement('div');by.className='bytes';
    const upd=()=>{const n=bytes(dm.value);by.textContent=n+' / 1000 bytes';by.className='bytes'+(n>1000?' over':'')};
    dm.oninput=()=>{r.dm=dm.value;upd()};upd();
    const pr=document.createElement('textarea');pr.value=(r.publicReplies||[]).join('\\n');pr.placeholder='One variant per line, e.g. Sent you a DM!';
    pr.oninput=()=>r.publicReplies=pr.value.split('\\n');
    const md=document.createElement('input');md.type='text';md.value=r.mediaId||'';md.placeholder='Leave empty for every post';md.oninput=()=>r.mediaId=md.value;
    const en=document.createElement('input');en.type='checkbox';en.checked=r.enabled!==false;en.onchange=()=>r.enabled=en.checked;
    const enl=document.createElement('label');enl.append(en,' Rule on');
    const del=document.createElement('button');del.className='d';del.textContent='Delete rule';del.onclick=()=>{settings.rules.splice(i,1);render()};
    c.append(field('Keywords (comma separated)',kw),field('DM message (the link goes here)',dm),by,field('Public reply variants (optional)',pr),field('Only this media ID (optional)',md),enl,del);
    box.appendChild(c)})
}
function renderLog(log){const b=$('log');b.textContent='';(log||[]).forEach(e=>{const tr=document.createElement('tr');[new Date(e.at).toLocaleString(),e.user,e.rule,e.dm,e.reply].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});b.appendChild(tr)})}
async function load(){const r=await fetch('/api/admin/ig-rules');if(!r.ok){msg('Could not load ('+r.status+')',true);return}const d=await r.json();settings=d.settings;render();renderLog(d.log)}
$('on').onchange=()=>settings.enabled=$('on').checked;
$('add').onclick=()=>{settings.rules.push({keywords:'',dm:'',publicReplies:[],mediaId:'',enabled:true});render()};
$('save').onclick=async()=>{
  const body={enabled:settings.enabled,rules:settings.rules.map(r=>({...r,publicReplies:(r.publicReplies||[]).map(x=>x.trim()).filter(Boolean)}))};
  const r=await fetch('/api/admin/ig-rules',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();if(!r.ok){msg(d.error||'Save failed',true);return}settings=d.settings;render();msg('Saved ✓')};
load();
</script></main></body></html>`
