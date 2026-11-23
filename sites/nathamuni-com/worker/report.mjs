/**
 * Visual report pages opened from Telegram buttons: /report/<section>?e=<expiry>&t=<signature>.
 * The link is an HMAC-signed, expiring token (no login, nothing to set up); the page is rendered
 * on the fly from the synced Instagram data and is mobile-first. One section per command.
 */

import { ageDays, escapeHtml, fmt, istToday } from '../scripts/ig-report-core.mjs'

const SITE = 'https://nathamuni.com'
const TTL_SECONDS = 3600

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')

async function sign(secret, section, exp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`report:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${section}.${exp}`)))
}

/** A one-hour link to a report section, or '' when the secret is missing. */
export async function reportLink(env, section, now = Date.now()) {
  const secret = env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) return ''
  const exp = Math.floor(now / 1000) + TTL_SECONDS
  return `${SITE}/report/${section}?e=${exp}&t=${await sign(secret, section, exp)}`
}

export async function verifyReport(env, section, exp, token, now = Date.now()) {
  const secret = env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || !/^\d{9,12}$/.test(String(exp)) || !/^[0-9a-f]{64}$/.test(String(token))) return false
  if (Number(exp) * 1000 < now) return false
  const want = await sign(secret, section, exp)
  let diff = 0
  for (let i = 0; i < 64; i++) diff |= want.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}

const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : '–')
const secs = (ms) => (Number.isFinite(ms) ? `${(ms / 1000).toFixed(1)}s` : '–')
const thumb = (v) => (v.thumbnail ? (v.thumbnail.startsWith('http') ? v.thumbnail : `${SITE}${v.thumbnail}`) : '')

const STYLE = `
:root{--bg:#faf9f6;--card:#fff;--ink:#23282e;--mut:#4a525c;--line:#e4e1da;--acc:#c2410c;--bar:#e9e5dc}
@media(prefers-color-scheme:dark){:root{--bg:#14171a;--card:#1c2024;--ink:#eceae4;--mut:#b4bac2;--line:#2e343b;--acc:#fb923c;--bar:#2a3036}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:20px 16px 56px}h1{font-size:22px;margin:0 0 2px}.sub{color:var(--mut);margin:0 0 16px;font-size:14px}
.row{display:grid;grid-template-columns:28px 64px 1fr;gap:12px;align-items:start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;text-decoration:none;color:inherit}
.n{font-weight:700;color:var(--acc);font-size:18px;padding-top:2px}.th{width:64px;height:84px;border-radius:8px;object-fit:cover;background:var(--bar)}
.t{font-weight:600;line-height:1.3;margin-bottom:6px;overflow-wrap:anywhere}.bar{height:8px;border-radius:4px;background:var(--bar);margin:6px 0}.bar i{display:block;height:100%;border-radius:4px;background:var(--acc)}
.m{display:flex;flex-wrap:wrap;gap:4px 14px;color:var(--mut);font-size:14px}.m b{color:var(--ink)}.foot{color:var(--mut);font-size:13px;margin-top:14px}
`

function page(title, sub, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main><h1>${escapeHtml(title)}</h1><p class="sub">${escapeHtml(sub)}</p>${body}</main></body></html>`
}

/** /best — top reels of the last 30 days as cards with a views bar and the rates that matter. */
export function bestPage(videos, today) {
  const top = videos
    .filter((v) => v.publishedDate && Number.isFinite(v.views))
    .map((v) => ({ v, age: ageDays(v.publishedDate, today) }))
    .filter((x) => x.age >= 0 && x.age <= 30)
    .sort((a, b) => b.v.views - a.v.views)
    .slice(0, 10)
    .map((x) => x.v)
  if (!top.length) return page('Top reels', 'Last 30 days', '<p>No reels with stats in the last 30 days yet.</p>')
  const max = top[0].views || 1
  const rows = top
    .map(
      (v, i) => `<a class="row" href="${escapeHtml(v.instagramUrl)}" target="_blank" rel="noopener"><span class="n">${i + 1}</span>${
        thumb(v) ? `<img class="th" src="${escapeHtml(thumb(v))}" alt="" loading="lazy">` : '<span class="th"></span>'
      }<span><div class="t">${escapeHtml(String(v.title || 'Reel').slice(0, 90))}</div><div class="bar"><i style="width:${Math.max(3, Math.round((100 * v.views) / max))}%"></i></div><div class="m"><span><b>${fmt(v.views)}</b> views</span><span>saved <b>${pct(v.saved, v.reach)}</b></span><span>shared <b>${pct(v.shares, v.reach)}</b></span><span>watched <b>${secs(v.avgWatchTimeMs)}</b></span></div></span></a>`,
    )
    .join('')
  return page('Top reels', `Last 30 days · ${top.length} reels · tap one to open it on Instagram`, `${rows}<p class="foot">Saved and shared are a percentage of reach. Shares bring new people in.</p>`)
}

export const SECTIONS = { best: bestPage }

export async function handleReport(request, env, loadVideos) {
  const url = new URL(request.url)
  const section = url.pathname.replace(/^\/report\//, '')
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' }
  const render = SECTIONS[section]
  if (!render || !(await verifyReport(env, section, url.searchParams.get('e'), url.searchParams.get('t')))) {
    return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;padding:24px"><p>This link has expired. Ask the bot again.</p>', { status: 403, headers })
  }
  return new Response(render(await loadVideos(), istToday()), { headers })
}
