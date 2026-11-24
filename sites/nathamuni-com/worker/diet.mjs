/**
 * The /diet download gate.
 *
 * Nothing under /downloads/diet/ and nothing at /diet/latest.zip is served without a
 * short-lived token that only POST /api/diet/lead can issue, and that needs a name and an
 * Indian mobile number. A shared link therefore lands on /diet with the form open instead
 * of downloading.
 *
 * Without OTP the number is not proven, so the controls are: strict validation, a honeypot,
 * a same-origin check, a per-IP hourly limit, and an HMAC token (10 min, bound to the
 * requester's IP and to nothing else) verified on every zip request. Leads go to the INBOX
 * KV as `lead:diet:<iso time>:<random>` (one write per lead; KV free tier is 1,000 writes
 * a day, which is the ceiling on leads/day). The token is stateless, so it costs no write.
 *
 * Secret: DIET_TOKEN_SECRET (Worker secret). Absent => the gate fails closed.
 */

import manifest from '../lib/diet.json'

export const DIET_LATEST_PATH = '/diet/latest.zip'
export const DIET_LEAD_PATH = '/api/diet/lead'
export const DIET_FILES_PREFIX = '/downloads/diet/'
export const DIET_GATE_PATH = '/diet?get=1'
export const TOKEN_TTL_SECONDS = 600
export const LEAD_PER_IP_HOURLY = 5
const TOKEN_PURPOSE = 'diet-dl'
const NAME_MIN = 2
const NAME_MAX = 60
const enc = new TextEncoder()

// ---------- validation ----------

/** Trim, collapse whitespace; 2-60 chars, at least two letters, no markup or links. */
export function normaliseName(raw) {
  const name = String(raw ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null
  if (/[<>@:/\\\d_=]|https?|www\./i.test(name)) return null
  if ((name.match(/\p{L}/gu) ?? []).length < 2) return null
  if (/[^\p{L}\p{M} .'’-]/u.test(name)) return null
  return name
}

/** Indian mobile -> 10 digits (6-9 first), accepting +91 / 91 / 0 prefixes. null if invalid. */
export function normalisePhone(raw) {
  let digits = String(raw ?? '').replace(/[\s\-().]/g, '')
  if (/[^\d+]/.test(digits) || digits.indexOf('+') > 0) return null
  digits = digits.replace(/^\+/, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (!/^[6-9]\d{9}$/.test(digits)) return null
  if (/^(\d)\1{9}$/.test(digits)) return null // 9999999999
  return digits
}

// ---------- crypto ----------

function toB64url(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toB64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function ipHash(secret, ip) {
  return (await hmac(secret, `ip|${ip}`)).slice(0, 22)
}

/** `<expiry unix s>.<mac>`; the mac covers purpose, expiry and the requester's IP hash. */
export async function signDownloadToken(secret, ip, now = Date.now()) {
  const exp = Math.floor(now / 1000) + TOKEN_TTL_SECONDS
  return `${exp}.${await hmac(secret, `${TOKEN_PURPOSE}|${exp}|${await ipHash(secret, ip)}`)}`
}

export async function verifyDownloadToken(secret, token, ip, now = Date.now()) {
  if (!secret || typeof token !== 'string') return false
  const [expStr, mac, extra] = token.split('.')
  if (extra !== undefined || !/^\d{1,12}$/.test(expStr ?? '') || !mac) return false
  const exp = Number(expStr)
  if (exp * 1000 < now || exp * 1000 > now + (TOKEN_TTL_SECONDS + 60) * 1000) return false
  return safeEqual(mac, await hmac(secret, `${TOKEN_PURPOSE}|${exp}|${await ipHash(secret, ip)}`))
}

// ---------- helpers ----------

const clientIp = (request) => request.headers.get('cf-connecting-ip') ?? 'unknown'

function json(obj, status = 200) {
  return Response.json(obj, { status, headers: { 'cache-control': 'no-store' } })
}

function toGate(request) {
  return new Response(null, {
    status: 302,
    headers: { location: new URL(DIET_GATE_PATH, request.url).toString(), 'cache-control': 'no-store' },
  })
}

async function readCounter(cache, key) {
  const res = await cache.match(key)
  if (!res) return 0
  return (await res.json().catch(() => null))?.count ?? 0
}

function releaseFiles(data) {
  return (data.releases ?? []).map((r) => r.file)
}

// ---------- routes ----------

/**
 * /diet/latest.zip: with a valid token redirect to the newest zip (token carried along);
 * without one send the visitor to the form. Never a direct download.
 */
export async function handleDietLatest(request, env = {}, data = manifest) {
  const latest = data.releases?.[0]
  if (!latest) {
    return new Response('No version of the diet plugin has been published yet.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  const token = new URL(request.url).searchParams.get('t')
  if (!(await verifyDownloadToken(env.DIET_TOKEN_SECRET, token, clientIp(request)))) return toGate(request)
  const target = new URL(latest.file, request.url)
  target.searchParams.set('t', token)
  return new Response(null, { status: 302, headers: { location: target.toString(), 'cache-control': 'no-store' } })
}

/** /downloads/diet/<zip>: served from assets only with a valid token; otherwise the form. */
export async function handleDietFile(request, env) {
  const url = new URL(request.url)
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 })
  if (!(await verifyDownloadToken(env.DIET_TOKEN_SECRET, url.searchParams.get('t'), clientIp(request)))) {
    return toGate(request)
  }
  url.search = ''
  const res = await env.ASSETS.fetch(new Request(url, { method: request.method }))
  if (!res.ok) return res
  const headers = new Headers(res.headers)
  headers.set('content-disposition', `attachment; filename="${url.pathname.split('/').pop()}"`)
  headers.set('cache-control', 'private, no-store')
  return new Response(res.body, { status: res.status, headers })
}

/** POST /api/diet/lead {name, phone, file?, website(honeypot)} -> {ok, url} */
export async function handleDietLead(request, env, data = manifest) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  if (!env.INBOX || !env.DIET_TOKEN_SECRET) {
    return json({ error: 'Downloads are being set up. Please try again soon.' }, 503)
  }
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Not allowed.' }, 403)
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ error: 'Invalid request.' }, 400)
  }
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  // Honeypot: bots fill every field. Pretend success, issue nothing, store nothing.
  if (String(body?.website ?? '').trim() !== '') return json({ ok: true })

  const name = normaliseName(body?.name)
  const phone = normalisePhone(body?.phone)
  if (!name) return json({ error: 'Please enter your name (letters only).', field: 'name' }, 400)
  if (!phone) return json({ error: 'Please enter a valid 10-digit Indian mobile number.', field: 'phone' }, 400)

  const files = releaseFiles(data)
  const file = body?.file == null || body.file === '' ? files[0] : files.find((f) => f === body.file)
  if (!file) return json({ error: 'That version does not exist.' }, 400)

  const ip = clientIp(request)
  const cache = caches.default
  const rateKey = new Request(`https://rate.nathamuni.internal/diet-lead/${await ipHash(env.DIET_TOKEN_SECRET, ip)}/${Math.floor(Date.now() / 3600_000)}`)
  const used = await readCounter(cache, rateKey)
  if (used >= LEAD_PER_IP_HOURLY) return json({ error: 'Too many attempts. Please try again in an hour.' }, 429)
  await cache.put(
    rateKey,
    new Response(JSON.stringify({ count: used + 1 }), { headers: { 'cache-control': 'max-age=3600' } })
  )

  const at = new Date().toISOString()
  const id = toB64url(crypto.getRandomValues(new Uint8Array(6)))
  await env.INBOX.put(
    `lead:diet:${at}:${id}`,
    JSON.stringify({
      name,
      phone,
      at,
      file,
      ipHash: await ipHash(env.DIET_TOKEN_SECRET, ip),
      ua: (request.headers.get('user-agent') ?? '').slice(0, 200),
    })
  )

  const token = await signDownloadToken(env.DIET_TOKEN_SECRET, ip)
  return json({ ok: true, url: `${file}?t=${token}` })
}
