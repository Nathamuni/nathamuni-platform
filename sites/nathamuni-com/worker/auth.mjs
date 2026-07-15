/**
 * Optional accounts so a visitor's course/session/metric progress survives
 * beyond one browser. Deliberately minimal and privacy-honest:
 *   - email + password only (no names, no newsletter, no tracking)
 *   - PBKDF2-SHA256 password hashing (100k iterations, per-user random salt)
 *   - HMAC-SHA256 signed session cookies (HttpOnly, Secure, SameSite=Lax)
 *   - per-IP auth rate limiting to blunt brute force
 *   - progress is a shallow-merged JSON blob, one key per user
 *
 * All state lives in the same INBOX KV that powers the question log, so this
 * costs nothing extra. Inert (503) until that namespace is bound. The signing
 * secret bootstraps itself into KV on first use — no manual secret to set.
 */

const PBKDF2_ITERATIONS = 100_000
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const AUTH_PER_IP_HOURLY_LIMIT = 12
const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 200
const MAX_PROGRESS_BYTES = 100_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const COOKIE_NAME = 'nm_session'

const enc = new TextEncoder()
const dec = new TextDecoder()

function toB64url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Constant-time byte comparison — no early return on first mismatch. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function hashPassword(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return new Uint8Array(bits)
}

/** Signing secret, generated once and stored in KV (only the Worker can read KV). */
async function getAuthSecret(kv) {
  let secret = await kv.get('_auth_secret')
  if (!secret) {
    secret = toB64url(crypto.getRandomValues(new Uint8Array(32)))
    await kv.put('_auth_secret', secret)
  }
  return secret
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return toB64url(new Uint8Array(sig))
}

async function signSession(kv, email) {
  const secret = await getAuthSecret(kv)
  const payload = { email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }
  const payloadB64 = toB64url(enc.encode(JSON.stringify(payload)))
  const sig = await hmac(secret, payloadB64)
  return `${payloadB64}.${sig}`
}

async function verifySession(kv, token) {
  if (!token || !token.includes('.')) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const secret = await getAuthSecret(kv)
  const expected = await hmac(secret, payloadB64)
  if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return null
  let payload
  try {
    payload = JSON.parse(dec.decode(fromB64url(payloadB64)))
  } catch {
    return null
  }
  if (!payload?.email || !payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload.email
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
}

function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

function readSessionCookie(request) {
  const cookie = request.headers.get('Cookie') || ''
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return m ? m[1] : null
}

async function currentUser(kv, request) {
  const token = readSessionCookie(request)
  if (!token) return null
  return verifySession(kv, token)
}

async function loadProgress(kv, email) {
  return (await kv.get(`progress:${email}`, 'json')) ?? {}
}

/** Shallow merge so a save from one device never wipes another device's keys. */
async function saveProgress(kv, email, incoming) {
  const existing = (await kv.get(`progress:${email}`, 'json')) ?? {}
  const merged = { ...existing, ...incoming, _updatedAt: new Date().toISOString() }
  await kv.put(`progress:${email}`, JSON.stringify(merged))
  return merged
}

async function authRateLimited(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const bucket = Math.floor(Date.now() / 3600_000)
  const key = new Request(`https://cache.internal/auth-rate/${ip}/${bucket}`)
  const cache = caches.default
  const res = await cache.match(key)
  const count = res ? ((await res.json().catch(() => ({ count: 0 }))).count ?? 0) : 0
  if (count >= AUTH_PER_IP_HOURLY_LIMIT) return true
  await cache.put(
    key,
    new Response(JSON.stringify({ count: count + 1 }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' },
    })
  )
  return false
}

function json(obj, status = 200, cookie) {
  const headers = { 'content-type': 'application/json' }
  if (cookie) headers['set-cookie'] = cookie
  return new Response(JSON.stringify(obj), { status, headers })
}

/**
 * Routes: /api/auth/{signup,login,logout,me,progress}
 * `subpath` is the segment after /api/auth/.
 */
export async function handleAuth(request, env, subpath) {
  if (!env.INBOX) {
    return json(
      { error: 'Accounts are opening soon — your progress is still safe in this browser.' },
      503
    )
  }
  const kv = env.INBOX

  if (subpath === 'me' && request.method === 'GET') {
    const email = await currentUser(kv, request)
    if (!email) return json({ authed: false })
    return json({ authed: true, email, progress: await loadProgress(kv, email) })
  }

  if (subpath === 'logout' && request.method === 'POST') {
    return json({ ok: true }, 200, clearCookie())
  }

  if ((subpath === 'signup' || subpath === 'login') && request.method === 'POST') {
    if (await authRateLimited(request)) {
      return json({ error: 'Too many attempts — wait a little and try again.' }, 429)
    }
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid request.' }, 400)
    }
    const email = (body?.email ?? '').toString().trim().toLowerCase()
    const password = (body?.password ?? '').toString()
    const localProgress =
      body?.progress && typeof body.progress === 'object' ? body.progress : null

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: 'That email does not look right.' }, 400)
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return json({ error: `Use at least ${MIN_PASSWORD_LEN} characters for your password.` }, 400)
    }
    if (password.length > MAX_PASSWORD_LEN) {
      return json({ error: 'That password is too long.' }, 400)
    }
    if (localProgress && JSON.stringify(localProgress).length > MAX_PROGRESS_BYTES) {
      return json({ error: 'Too much saved progress to sync at once.' }, 413)
    }

    const userKey = `user:${email}`
    const existing = await kv.get(userKey, 'json')

    if (subpath === 'signup') {
      if (existing) {
        return json({ error: 'An account with that email already exists — try logging in.' }, 409)
      }
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const hash = await hashPassword(password, salt)
      await kv.put(
        userKey,
        JSON.stringify({
          email,
          salt: toB64url(salt),
          hash: toB64url(hash),
          createdAt: new Date().toISOString(),
        })
      )
      let progress = {}
      if (localProgress) progress = await saveProgress(kv, email, localProgress)
      const token = await signSession(kv, email)
      return json({ ok: true, email, progress }, 200, sessionCookie(token))
    }

    // login
    if (!existing) {
      return json({ error: 'No account with that email yet — create one first.' }, 401)
    }
    const candidate = await hashPassword(password, fromB64url(existing.salt))
    if (!timingSafeEqual(candidate, fromB64url(existing.hash))) {
      return json({ error: 'Email or password is wrong.' }, 401)
    }
    let progress = await loadProgress(kv, email)
    // First login on a device that already has local progress and no server
    // progress yet: adopt the local copy so nothing is lost.
    if (localProgress && Object.keys(progress).filter((k) => k !== '_updatedAt').length === 0) {
      progress = await saveProgress(kv, email, localProgress)
    }
    const token = await signSession(kv, email)
    return json({ ok: true, email, progress }, 200, sessionCookie(token))
  }

  if (subpath === 'progress' && request.method === 'POST') {
    const email = await currentUser(kv, request)
    if (!email) return json({ error: 'Not signed in.' }, 401)
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid request.' }, 400)
    }
    if (!body?.progress || typeof body.progress !== 'object') {
      return json({ error: 'Nothing to save.' }, 400)
    }
    if (JSON.stringify(body.progress).length > MAX_PROGRESS_BYTES) {
      return json({ error: 'Too much data to save.' }, 413)
    }
    const merged = await saveProgress(kv, email, body.progress)
    return json({ ok: true, progress: merged })
  }

  return json({ error: 'Not found.' }, 404)
}
