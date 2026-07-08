/**
 * Site Worker: serves the static export and adds /api/search — semantic
 * search over the library using Workers AI (@cf/baai/bge-m3, multilingual
 * so Tamil and English captions both embed meaningfully).
 *
 * Document vectors are computed lazily on first use from the build's
 * /search-index.json, then cached in the Cache API keyed by the index
 * content hash — they recompute automatically whenever the library changes.
 */

const MODEL = '@cf/baai/bge-m3'
const TOP_K = 12
const EMBED_BATCH = 90

let memoryCache = null // { hash, vectors, items } per isolate

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
    return env.ASSETS.fetch(request)
  },
}

export default worker
