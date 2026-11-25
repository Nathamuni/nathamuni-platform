/**
 * Shared Telegram chart image: renderChart({ title, subtitle, rows }) → PNG bytes.
 * Every command passes its own rows; the look stays the same. Rows: { label, value, meta?, thumb? }
 * (thumb = image data URI, optional). The chart is written as plain SVG and drawn with resvg (wasm).
 * satori was dropped: its text engine compiles wasm at runtime, which Cloudflare Workers forbid.
 * Loaded lazily by callers so a failure here never breaks the text reply.
 */
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import wasm from '@resvg/resvg-wasm/index_bg.wasm'
import inter400 from './fonts/inter-400.ttf'
import inter700 from './fonts/inter-700.ttf'
import tamil400 from './fonts/tamil-400.ttf'
import tamil700 from './fonts/tamil-700.ttf'

const W = 900
const ROW_H = 132
const HEAD_H = 104

let ready
const init = () => (ready ??= initWasm(wasm))

const FONT_BUFFERS = () => [inter400, inter700, tamil400, tamil700].map((b) => new Uint8Array(b))
const FAMILY = "Inter, 'Noto Sans Tamil'"

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Fetch a thumbnail as a data URI; '' when it cannot be loaded so one bad image never fails the chart. */
export async function toDataUri(url, env) {
  try {
    // Our own covers come straight from the bundled assets; a Worker fetching its own domain can fail.
    const res = env?.ASSETS && url.startsWith('https://nathamuni.com/') ? await env.ASSETS.fetch(new Request(url)) : await fetch(url)
    if (!res.ok) return ''
    const buf = new Uint8Array(await res.arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    return `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${btoa(bin)}`
  } catch {
    return ''
  }
}

// Emoji have no glyph in the bundled fonts and draw as empty boxes, so drop them; cut long titles with an ellipsis.
const clean = (s, n) => {
  const t = String(s ?? '').replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200d\ufe0f]/gu, '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

/** Pure: spec → SVG text. Exported for tests. */
export function chartSvg({ title, subtitle, rows }) {
  const height = HEAD_H + rows.length * ROW_H + 24
  const max = Math.max(1, ...rows.map((r) => r.value))
  const text = (x, y, size, weight, fill, s) =>
    `<text x="${x}" y="${y}" font-family="${FAMILY}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`
  const body = rows
    .map((r, i) => {
      const y = HEAD_H + i * ROW_H
      const bar = Math.max(14, Math.round((560 * r.value) / max))
      return [
        `<line x1="28" y1="${y + ROW_H}" x2="${W - 28}" y2="${y + ROW_H}" stroke="#e4e1da"/>`,
        text(28, y + 76, 30, 700, '#c2410c', String(i + 1)),
        r.thumb
          ? `<clipPath id="c${i}"><rect x="72" y="${y + 14}" width="78" height="104" rx="10"/></clipPath><image href="${esc(r.thumb)}" x="72" y="${y + 14}" width="78" height="104" preserveAspectRatio="xMidYMid slice" clip-path="url(#c${i})"/>`
          : `<rect x="72" y="${y + 14}" width="78" height="104" rx="10" fill="#e9e5dc"/>`,
        text(168, y + 40, 24, 700, '#23282e', clean(r.label, 46)),
        `<rect x="168" y="${y + 54}" width="560" height="16" rx="8" fill="#e9e5dc"/>`,
        `<rect x="168" y="${y + 54}" width="${bar}" height="16" rx="8" fill="#c2410c"/>`,
        text(168, y + 100, 20, 400, '#4a525c', r.meta || ''),
      ].join('')
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}"><rect width="${W}" height="${height}" fill="#faf9f6"/>${text(28, 62, 38, 700, '#23282e', title)}${text(28, 92, 20, 400, '#4a525c', subtitle || '')}${body}</svg>`
}

export async function renderChart(spec) {
  await init()
  const resvg = new Resvg(chartSvg(spec), {
    font: { fontBuffers: FONT_BUFFERS(), defaultFontFamily: 'Inter', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}
