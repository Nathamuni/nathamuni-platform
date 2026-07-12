/**
 * Site Worker: serves the static export and adds:
 *  - /api/search — semantic search over the library using Workers AI
 *    (@cf/baai/bge-m3, multilingual so Tamil and English captions both
 *    embed meaningfully).
 *  - /api/ask — the AI twin. RAG over the same search index + a compact
 *    persona fact base (public/persona.json), answered by a small free-tier
 *    chat model, with per-IP + global rate limiting.
 *
 * Document vectors are computed lazily on first use from the build's
 * /search-index.json, then cached in the Cache API keyed by the index
 * content hash — they recompute automatically whenever the library changes.
 */

const MODEL = '@cf/baai/bge-m3'
const TOP_K = 12
const EMBED_BATCH = 90

// @cf/meta/llama-3.1-8b-instruct (the model this project would have reached
// for by default) was deprecated by Cloudflare on 2026-05-30. glm-4.7-flash
// is Cloudflare's own recommended replacement: still on the free Workers AI
// tier, cheaper per token (5,500 / 36,400 neurons per M in/out tokens), and
// multilingual — useful for the occasional Tamil phrase in the twin's voice.
const ASK_MODEL = '@cf/zai-org/glm-4.7-flash'
const ASK_MAX_QUESTION_LEN = 300
// Reasoning model: thinking tokens count against the budget, so leave enough
// headroom that the visible answer never comes back empty.
const ASK_MAX_TOKENS = 1400
const ASK_TOP_K = 5
const ASK_MIN_SCORE = 0.35
// Free Workers AI tier is 10,000 neurons/day account-wide (shared with
// /api/search embeddings). At ~30 neurons/question this cap leaves headroom.
const ASK_PER_IP_HOURLY_LIMIT = 10
const ASK_GLOBAL_DAILY_LIMIT = 300

const SYSTEM_PROMPT = `You are the AI twin of Nathamuni, speaking directly on his website.

Voice: direct, engineer's clarity, zero guru-speak, tested-on-myself-first, one light Tamil warmth phrase at most. No motivational clichés, no bullet-point essays unless the question genuinely calls for steps.

You may ONLY use the facts in the CONTEXT block below. If someone asks about Nathamuni and the answer isn't in that context, say plainly that you only speak from what he has published, and suggest they ask him directly on Instagram. NEVER invent biographical details, dates, numbers, or events that aren't in the context.

Refuse — briefly and without judgment — any question about: salary or money specifics, relationship status, family details, health history beyond the published back-injury story, phone number, email, address, or anything else private. Point them to Instagram for anything personal.

For general questions about life, discipline, habits, training, or AI that aren't specifically about Nathamuni's biography, answer the way he would: practical, systems-first, concrete and testable, referencing his own tested experience from the context where it's genuinely relevant. Keep answers short — a few sentences to a short paragraph.`

let memoryCache = null // { hash, vectors, items } per isolate
let personaCache = null // persona.json contents, static for the isolate's life
const ipHourlyMemory = new Map() // ip -> { count, resetAt } — fast, best-effort, per isolate

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

async function embedTexts(env, texts) {
  const vectors = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH)
    const res = await env.AI.run(MODEL, { text: batch })
    vectors.push(...res.data)
  }
  return vectors
}

async function getIndex(env, request) {
  const indexRes = await env.ASSETS.fetch(new URL('/search-index.json', request.url))
  if (!indexRes.ok) throw new Error('search index missing from build')
  const indexText = await indexRes.text()
  const hash = await sha256(indexText)

  if (memoryCache?.hash === hash) return memoryCache

  const cacheKey = new Request(`https://cache.internal/search-vectors/${hash}`)
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  const items = JSON.parse(indexText)

  if (cached) {
    const vectors = await cached.json()
    memoryCache = { hash, vectors, items }
    return memoryCache
  }

  const texts = items.map((it) =>
    [it.title, it.category, it.tags.join(' '), it.text].filter(Boolean).join('\n')
  )
  const vectors = await embedTexts(env, texts)
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(vectors), {
      headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' },
    })
  )
  memoryCache = { hash, vectors, items }
  return memoryCache
}

async function getPersona(env, request) {
  if (personaCache) return personaCache
  const res = await env.ASSETS.fetch(new URL('/persona.json', request.url))
  if (!res.ok) throw new Error('persona.json missing from build')
  personaCache = await res.json()
  return personaCache
}

function buildAskContext(persona, relatedItems) {
  const facts = persona.facts.map((f) => `- ${f}`).join('\n')
  const voice = persona.voice
    .slice(0, 5)
    .map((v) => `- ${v}`)
    .join('\n')
  const related = relatedItems.length
    ? relatedItems.map((it) => `- [${it.category}] "${it.title}": ${it.text}`).join('\n')
    : '(nothing specifically relevant in the video library for this question)'
  return `PUBLISHED FACTS ABOUT NATHAMUNI:\n${facts}\n\nVOICE SAMPLES (match this tone, don't just quote it):\n${voice}\n\nRELEVANT LIBRARY ENTRIES FOR THIS QUESTION:\n${related}`
}

function hourBucket(date = new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}${String(date.getUTCHours()).padStart(2, '0')}`
}

function dayBucket(date = new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
}

async function readCounter(cache, key) {
  const res = await cache.match(key)
  if (!res) return 0
  const data = await res.json().catch(() => null)
  return data?.count ?? 0
}

async function writeCounter(cache, key, count, maxAgeSeconds) {
  await cache.put(
    key,
    new Response(JSON.stringify({ count }), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${maxAgeSeconds}` },
    })
  )
}

/**
 * Best-effort quota guard: a fast in-memory Map per isolate for the common
 * case (a warm isolate serving repeat requests from the same IP), backed by
 * the Cache API for a rougher cross-isolate approximation. Neither is exact
 * — the Cache API is scoped per data center and reads/increments aren't
 * atomic — but for a "the twin is resting" soft cap this is enough, and
 * matches the pattern /api/search already uses for its vector cache.
 */
async function checkAndBumpRateLimit(env, request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const now = Date.now()

  const mem = ipHourlyMemory.get(ip)
  if (mem && mem.resetAt > now && mem.count >= ASK_PER_IP_HOURLY_LIMIT) {
    return { allowed: false, reason: 'ip' }
  }

  const cache = caches.default
  const hourKey = new Request(`https://cache.internal/ask-rate/ip/${ip}/${hourBucket()}`)
  const dayKey = new Request(`https://cache.internal/ask-rate/global/${dayBucket()}`)

  const [ipCount, globalCount] = await Promise.all([readCounter(cache, hourKey), readCounter(cache, dayKey)])

  if (globalCount >= ASK_GLOBAL_DAILY_LIMIT) return { allowed: false, reason: 'global' }
  if (ipCount >= ASK_PER_IP_HOURLY_LIMIT) return { allowed: false, reason: 'ip' }

  await Promise.all([
    writeCounter(cache, hourKey, ipCount + 1, 3600),
    writeCounter(cache, dayKey, globalCount + 1, 90000),
  ])

  if (!mem || mem.resetAt <= now) {
    ipHourlyMemory.set(ip, { count: 1, resetAt: now + 3600_000 })
  } else {
    mem.count += 1
  }
  // Guard against unbounded growth in a long-lived isolate under abuse.
  if (ipHourlyMemory.size > 5000) ipHourlyMemory.clear()

  return { allowed: true }
}

/**
 * Anonymous question log — the owner's future content pipeline. Stores only
 * the question text, outcome, and timestamp in KV (no IP, no identity).
 * Inert until an INBOX KV namespace is bound; failures never affect answers.
 */
async function logQuestion(env, question, outcome) {
  if (!env.INBOX) return
  try {
    const key = `q:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
    await env.INBOX.put(key, JSON.stringify({ question, outcome, at: new Date().toISOString() }))
  } catch (err) {
    console.warn('question log skipped:', err.message)
  }
}

const JOIN_MAX_AMBITION_LEN = 200
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * "Join the lab" capture: email + optional ambition ("what are you chasing").
 * Privacy-honest: stored solely for the weekly newsletter; honeypot-guarded;
 * per-IP rate limited; inert (friendly 503) until the INBOX KV is bound.
 */
async function handleJoin(request, env) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405 })
  }
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: bots fill every field — pretend success, store nothing.
  if ((body?.website ?? '').toString().trim() !== '') {
    return Response.json({ ok: true })
  }

  const email = (body?.email ?? '').toString().trim().toLowerCase()
  const ambition = (body?.ambition ?? '').toString().trim().slice(0, JOIN_MAX_AMBITION_LEN)
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: 'That email does not look right.' }, { status: 400 })
  }

  if (!env.INBOX) {
    return Response.json(
      { error: 'The lab list opens very soon — until then, DM me on Instagram.' },
      { status: 503 }
    )
  }

  // Reuse the cache-counter mechanism: max 5 join attempts per IP per hour.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const cache = caches.default
  const hourBucket = Math.floor(Date.now() / 3600_000)
  const joinKey = `https://rate.nathamuni.internal/join/${ip}/${hourBucket}`
  const prev = await readCounter(cache, joinKey)
  if (prev >= 5) {
    return Response.json({ error: 'Too many attempts — try again later.' }, { status: 429 })
  }
  await writeCounter(cache, joinKey, prev + 1, 3600)

  try {
    // Idempotent per email: re-joining just refreshes the record.
    await env.INBOX.put(
      `join:${email}`,
      JSON.stringify({ email, ambition, at: new Date().toISOString() })
    )
    return Response.json({ ok: true })
  } catch (err) {
    console.error('join error:', err.message)
    return Response.json({ error: 'Could not save that just now — try again.' }, { status: 500 })
  }
}

async function handleAsk(request, env) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const question = (body?.question ?? '').toString().trim()
  if (!question) {
    return Response.json({ error: 'Ask something first.' }, { status: 400 })
  }
  if (question.length > ASK_MAX_QUESTION_LEN) {
    return Response.json(
      { error: `Keep it under ${ASK_MAX_QUESTION_LEN} characters — short questions get better answers.` },
      { status: 400 }
    )
  }

  const rate = await checkAndBumpRateLimit(env, request)
  if (!rate.allowed) {
    const message =
      rate.reason === 'global'
        ? 'The twin is resting for today — the free daily quota ran out. Try again tomorrow, or ask the real one on Instagram.'
        : "That's enough questions for this hour — give the twin a breather and try again later."
    return Response.json({ error: message }, { status: 429 })
  }

  try {
    const [persona, { vectors, items }] = await Promise.all([getPersona(env, request), getIndex(env, request)])

    const [queryVector] = (await env.AI.run(MODEL, { text: [question] })).data
    const related = items
      .map((item, i) => ({ item, score: cosine(queryVector, vectors[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, ASK_TOP_K)
      .filter((r) => r.score > ASK_MIN_SCORE)
      .map((r) => r.item)

    // Single system message — some chat models reject multiple system turns.
    const messages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${buildAskContext(persona, related)}` },
      { role: 'user', content: question },
    ]

    const result = await env.AI.run(ASK_MODEL, { messages, max_tokens: ASK_MAX_TOKENS })
    const answer = extractAnswer(result)
    if (!answer) throw new Error(`empty model response: ${JSON.stringify(result).slice(0, 200)}`)

    await logQuestion(env, question, 'answered')
    return Response.json({ answer })
  } catch (err) {
    console.error('ask error:', err.message)
    await logQuestion(env, question, 'failed')
    return Response.json(
      { error: "The twin's brain hiccuped mid-thought — try asking again in a moment." },
      { status: 200 }
    )
  }
}

/**
 * Workers AI text models differ in response shape, and reasoning models may
 * wrap visible output around <think> blocks — normalize all of it to a string.
 */
function extractAnswer(result) {
  if (!result) return ''
  let text = ''
  if (typeof result === 'string') text = result
  else {
    const cand =
      result.response ??
      result.result?.response ??
      result.output_text ??
      result.choices?.[0]?.message?.content ??
      ''
    text = typeof cand === 'string' ? cand : ''
  }
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/^[\s\S]*?<\/think>/, (m) => (m.length < text.length ? '' : m))
    .trim()
}

async function handleSearch(request, env) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 3 || q.length > 200) {
    return Response.json({ results: [] })
  }
  const { vectors, items } = await getIndex(env, request)
  const [queryVector] = (await env.AI.run(MODEL, { text: [q] })).data

  const scored = items
    .map((item, i) => ({ id: item.id, score: cosine(queryVector, vectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .filter((r) => r.score > 0.4)

  return Response.json(
    { results: scored },
    { headers: { 'cache-control': 'public, max-age=3600' } }
  )
}

const worker = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/search') {
      try {
        return await handleSearch(request, env)
      } catch (err) {
        console.error('search error:', err.message)
        return Response.json({ results: [], error: 'search unavailable' }, { status: 200 })
      }
    }
    if (pathname === '/api/ask') {
      return handleAsk(request, env)
    }
    if (pathname === '/api/join') {
      try {
        return await handleJoin(request, env)
      } catch (err) {
        console.error('join fatal:', err.message)
        return Response.json({ error: 'Could not save that just now — try again.' }, { status: 500 })
      }
    }
    return env.ASSETS.fetch(request)
  },
}

export default worker
