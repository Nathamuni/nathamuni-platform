#!/usr/bin/env node
/**
 * Post-deploy smoke check.
 *
 * Reads only — it never writes, never signs up an address, never sends mail. Safe to
 * run against production as often as you like.
 *
 *   node scripts/smoke-check.mjs                     # https://nathamuni.com
 *   node scripts/smoke-check.mjs http://localhost:4180
 *
 * Exits non-zero if any REQUIRED check fails, so it can gate a deploy.
 *
 * Checks marked INFO describe what is configured rather than what is broken — e.g. the
 * newsletter correctly returns 503 until its secrets are set, which is a pass, not a
 * failure. The point is to tell you which state you are actually in after a deploy.
 */
const BASE = (process.argv[2] ?? 'https://nathamuni.com').replace(/\/$/, '')

const results = []
const record = (level, name, ok, detail) => results.push({ level, name, ok, detail })

/**
 * A plain static file server (python http.server, `serve out`) has no Worker and no
 * clean-URL rewriting, so it 404s on /videos where production serves /videos.html.
 * Falling back keeps one script usable for both a pre-deploy dry run and production.
 */
async function get(path, opts = {}) {
  const read = async (res) =>
    res.headers.get('content-type')?.includes('application/json')
      ? JSON.stringify(await res.json().catch(() => ({})))
      : await res.text().catch(() => '')

  let res = await fetch(BASE + path, { redirect: 'follow', ...opts })
  let text = await read(res)

  // A plain static server (python http.server, `serve out`) has neither a Worker nor
  // clean-URL rewriting: it either 404s on /privacy or 301s to /privacy/ and hands back
  // a directory index. Both look like a "working" 200 to a naive check, which is how a
  // dry run can silently pass while reading the wrong document.
  const isDirectoryIndex = /<title>Directory listing/i.test(text)
  const needsHtml = res.status === 404 || isDirectoryIndex
  if (needsHtml && !path.includes('.') && !path.startsWith('/api/')) {
    const alt = await fetch(BASE + (path === '/' ? '/index.html' : `${path}.html`), {
      redirect: 'follow',
      ...opts,
    })
    if (alt.status === 200) {
      res = alt
      text = await read(alt)
    }
  }
  return { status: res.status, headers: res.headers, text }
}

/** True when the target has no Worker in front of it, so /api/* cannot be exercised. */
let workerAbsent = false

async function main() {
  // ---- pages render at all ----
  for (const path of ['/', '/videos', '/pulse', '/blog', '/sessions', '/courses', '/moments']) {
    try {
      const r = await get(path)
      record('REQUIRED', `page ${path}`, r.status === 200, `HTTP ${r.status}`)
    } catch (err) {
      record('REQUIRED', `page ${path}`, false, err.message)
    }
  }

  // ---- images: the WebP pipeline actually deployed ----
  try {
    const home = await get('/')
    const webp = (home.text.match(/\.webp/g) ?? []).length
    record('REQUIRED', 'WebP thumbnails served', webp > 0, `${webp} .webp references on /`)
    record(
      'REQUIRED',
      'homepage grid is server-rendered',
      home.text.includes('data-testid="video-card"') && !home.text.includes('Loading...'),
      'cards present, no Loading placeholder'
    )
  } catch (err) {
    record('REQUIRED', 'homepage content', false, err.message)
  }

  // A generated thumbnail must exist — this is the pipeline that, if it silently broke,
  // would leave every card imageless.
  try {
    const one = await get('/images/thumbnails/DbV8nOIE2dV.webp')
    record('REQUIRED', 'generated thumbnail reachable', one.status === 200, `HTTP ${one.status}`)
  } catch (err) {
    record('REQUIRED', 'generated thumbnail reachable', false, err.message)
  }

  // ---- feeds and metadata ----
  try {
    const feed = await get('/feed.xml')
    const items = (feed.text.match(/<item>/g) ?? []).length
    record('REQUIRED', 'RSS feed', feed.status === 200 && items > 0, `HTTP ${feed.status}, ${items} items`)
  } catch (err) {
    record('REQUIRED', 'RSS feed', false, err.message)
  }
  try {
    const sm = await get('/sitemap.xml')
    record('REQUIRED', 'sitemap includes /pulse', sm.text.includes('/pulse'), `HTTP ${sm.status}`)
  } catch (err) {
    record('REQUIRED', 'sitemap', false, err.message)
  }

  // ---- worker APIs still alive ----
  // Probe once to find out whether a Worker is actually in front of these assets. A
  // static dry run cannot exercise /api/*, and reporting that as breakage would train
  // you to ignore the script.
  try {
    const probe = await get('/api/videos')
    workerAbsent = probe.status === 404 || probe.status === 501
    if (workerAbsent) {
      record('SKIPPED', 'worker APIs', true, 'no Worker at this origin — static dry run')
    } else {
      record('REQUIRED', 'videos API', probe.status === 200, `HTTP ${probe.status}`)
      const s = await get('/api/search?q=discipline')
      record('REQUIRED', 'search API', s.status === 200, `HTTP ${s.status}`)
    }
  } catch (err) {
    record('REQUIRED', 'worker APIs', false, err.message)
  }

  // ---- newsletter: state, not pass/fail ----
  // Deliberately probes with an invalid address so nothing is ever stored or mailed.
  if (workerAbsent) {
    record('SKIPPED', 'newsletter', true, 'needs the Worker')
    record('SKIPPED', 'confirm link inert on GET', true, 'needs the Worker')
  } else {
  try {
    const r = await fetch(BASE + '/api/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    if (r.status === 503) {
      record('INFO', 'newsletter', true, 'closed — RESEND_API_KEY / JOIN_FROM_EMAIL not set yet')
    } else if (r.status === 400) {
      record('INFO', 'newsletter', true, 'LIVE and validating (secrets configured)')
    } else {
      record('REQUIRED', 'newsletter endpoint', false, `unexpected HTTP ${r.status}`)
    }
  } catch (err) {
    record('REQUIRED', 'newsletter endpoint', false, err.message)
  }

  // Confirmation links must not act on GET — a mail scanner following them would
  // otherwise confirm or unsubscribe people automatically.
  try {
    const g = await get('/api/join/confirm?token=smoke-test-not-a-real-token')
    const inert = !g.text.includes("You're in")
    record('REQUIRED', 'confirm link inert on GET', inert, `HTTP ${g.status}`)
  } catch (err) {
    record('REQUIRED', 'confirm link inert on GET', false, err.message)
  }
  }

  // ---- privacy/honesty copy survived the deploy ----
  try {
    const p = await get('/privacy')
    const mentionsHealth = /health|body weight|weight, height/i.test(p.text)
    record('REQUIRED', 'privacy discloses health sync', mentionsHealth, 'health data named on /privacy')
  } catch (err) {
    record('REQUIRED', 'privacy page', false, err.message)
  }

  // ---- analytics: state, not pass/fail ----
  try {
    const home = await get('/')
    const on = home.text.includes('cloudflareinsights.com')
    record('INFO', 'analytics', true, on ? 'beacon present' : 'not enabled (NEXT_PUBLIC_CF_BEACON_TOKEN unset at build)')
  } catch {
    /* covered above */
  }

  // ---- YouTube must NOT be contacted from the HTML itself ----
  try {
    const anyVideo = await get('/videos/build-the-chain-why-systems-beat-motivation')
    const hasFacade = anyVideo.text.includes('youtube-facade')
    const eagerIframe = /<iframe[^>]+youtube/i.test(anyVideo.text)
    record('REQUIRED', 'YouTube facade (no eager iframe)', hasFacade && !eagerIframe,
      `facade=${hasFacade} eagerIframe=${eagerIframe}`)
  } catch (err) {
    record('REQUIRED', 'YouTube facade', false, err.message)
  }

  // ---- report ----
  const pad = (s, n) => String(s).padEnd(n)
  console.log(`\nSmoke check — ${BASE}\n`)
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗'
    console.log(`  ${mark} ${pad(r.level, 9)} ${pad(r.name, 36)} ${r.detail}`)
  }
  const failed = results.filter((r) => !r.ok && r.level === 'REQUIRED')
  console.log(
    `\n${results.filter((r) => r.ok).length}/${results.length} ok` +
      (failed.length ? ` — ${failed.length} REQUIRED failing\n` : ' — all required checks passed\n')
  )
  process.exit(failed.length ? 1 : 0)
}

await main()
