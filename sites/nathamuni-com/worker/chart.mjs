/**
 * Shared Telegram chart image: renderChart({ title, subtitle, rows }) → PNG bytes.
 * Every command passes its own rows; the look stays the same. Rows: { label, value, meta?, thumb? }
 * (thumb = image URL, optional). Drawn on the worker with satori (layout → SVG) + resvg (SVG → PNG).
 * Loaded lazily by callers so a failure here never breaks the text reply.
 */
import satori from 'satori'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import wasm from '@resvg/resvg-wasm/index_bg.wasm'
import inter400 from './fonts/inter-400.woff'
import inter700 from './fonts/inter-700.woff'
import tamil400 from './fonts/tamil-400.woff'
import tamil700 from './fonts/tamil-700.woff'

const W = 900
const ROW_H = 132
const HEAD_H = 104

let ready
const init = () => (ready ??= initWasm(wasm))

const FONTS = [
  { name: 'Inter', data: inter400, weight: 400 },
  { name: 'Inter', data: inter700, weight: 700 },
  { name: 'Tamil', data: tamil400, weight: 400 },
  { name: 'Tamil', data: tamil700, weight: 700 },
]

const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } })

/** Fetch a thumbnail as a data URI; '' when it cannot be loaded so one bad image never fails the chart. */
export async function toDataUri(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return ''
    const buf = new Uint8Array(await res.arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    return `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${btoa(bin)}`
  } catch {
    return ''
  }
}

export function chartTree({ title, subtitle, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const body = rows.map((r, i) =>
    el('div', { alignItems: 'center', height: ROW_H, borderBottom: '1px solid #e4e1da' }, [
      el('div', { width: 44, fontSize: 30, fontWeight: 700, color: '#c2410c' }, String(i + 1)),
      r.thumb
        ? { type: 'img', props: { src: r.thumb, width: 78, height: 104, style: { borderRadius: 10, objectFit: 'cover', marginRight: 18 } } }
        : el('div', { width: 78, height: 104, borderRadius: 10, background: '#e9e5dc', marginRight: 18 }, ''),
      el('div', { flexDirection: 'column', flex: 1 }, [
        el('div', { fontSize: 24, fontWeight: 700, color: '#23282e', height: 32, overflow: 'hidden' }, String(r.label).slice(0, 48)),
        el('div', { height: 16, width: 560, borderRadius: 8, background: '#e9e5dc', marginTop: 8 }, [
          el('div', { height: 16, width: Math.max(14, Math.round((560 * r.value) / max)), borderRadius: 8, background: '#c2410c' }, ''),
        ]),
        el('div', { fontSize: 20, color: '#4a525c', marginTop: 8 }, r.meta || ''),
      ]),
    ]),
  )
  return el('div', { flexDirection: 'column', width: W, height: HEAD_H + rows.length * ROW_H + 24, padding: '24px 28px', background: '#faf9f6', fontFamily: 'Inter, Tamil' }, [
    el('div', { fontSize: 38, fontWeight: 700, color: '#23282e' }, title),
    el('div', { fontSize: 20, color: '#4a525c', marginBottom: 14 }, subtitle || ''),
    ...body,
  ])
}

export async function renderChart(spec) {
  await init()
  const svg = await satori(chartTree(spec), { width: W, height: HEAD_H + spec.rows.length * ROW_H + 24, fonts: FONTS })
  return new Resvg(svg).render().asPng()
}
