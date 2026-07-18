'use client'

import { useEffect, useRef, useState } from 'react'
import type { PulseGraphData, PulseNode } from '@/lib/pulse'

/**
 * Live neural-network visualization of the real content graph.
 *
 * Honest framing: this animates a force-directed layout of actual posts,
 * categories, and shared tags — node size is real engagement, edges are real
 * membership. The motion is a visualization, not live inference. The graph
 * unfolds from the center, breathes as one coherent web, and periodically a
 * category hub "fires" — a cascade of signal pulses chains outward through its
 * connections, flashing each node it reaches. Respects prefers-reduced-motion.
 */

interface Sim extends PulseNode {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  phase: number
  flash: number
}

interface Pulse {
  from: number
  to: number
  t: number
  speed: number
  hue: number
  depth: number
}

function hsla(hue: number, s: number, l: number, a: number) {
  return `hsla(${hue}, ${s}%, ${l}%, ${a})`
}

const INTRO_MS = 2200

export function PulseGraph({ data }: { data: PulseGraphData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<{ node: Sim; x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let dpr = Math.min(2, window.devicePixelRatio || 1)

    const idIndex = new Map(data.nodes.map((n, i) => [n.id, i]))
    // Seed nodes in a tight central cluster so the intro visibly *unfolds*
    // outward into the web instead of jittering in place.
    const nodes: Sim[] = data.nodes.map((n, i) => {
      const a = i * 2.399963
      const rad = 8 + (i % 7) * 3
      return {
        ...n,
        x: Math.cos(a) * rad,
        y: Math.sin(a) * rad,
        vx: 0,
        vy: 0,
        r: 4 + n.weight * (n.kind === 'category' ? 22 : n.kind === 'post' ? 11 : 6),
        phase: (i * 1.7) % (Math.PI * 2),
        flash: 0,
      }
    })
    const edges = data.edges
      .map((e) => ({ a: idIndex.get(e.source)!, b: idIndex.get(e.target)!, s: e.strength }))
      .filter((e) => e.a != null && e.b != null)

    // Adjacency for chaining activation cascades.
    const incident: { edge: number; other: number }[][] = nodes.map(() => [])
    edges.forEach((e, i) => {
      incident[e.a].push({ edge: i, other: e.b })
      incident[e.b].push({ edge: i, other: e.a })
    })
    const hubs = nodes.map((n, i) => (n.kind === 'category' ? i : -1)).filter((i) => i >= 0)

    const pulses: Pulse[] = []
    // Effective (breathing) positions, recomputed each frame; used for drawing + hit-test.
    const ex = new Float64Array(nodes.length)
    const ey = new Float64Array(nodes.length)

    function resize() {
      const rect = wrap!.getBoundingClientRect()
      W = rect.width
      H = rect.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = `${W}px`
      canvas!.style.height = `${H}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    function step(alpha: number) {
      const cx = W / 2
      const cy = H / 2
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy || 0.01
          if (d2 < 110000) {
            // Hubs repel harder so category labels don't collide.
            const q = (a.kind === 'category' ? 1.8 : 1) * (b.kind === 'category' ? 1.8 : 1)
            const force = (2800 * q / d2) * alpha
            const d = Math.sqrt(d2)
            const fx = (dx / d) * force
            const fy = (dy / d) * force
            a.vx += fx
            a.vy += fy
            b.vx -= fx
            b.vy -= fy
            const min = a.r + b.r + 16
            if (d < min) {
              const push = ((min - d) / d) * 0.5
              a.vx += dx * push
              a.vy += dy * push
              b.vx -= dx * push
              b.vy -= dy * push
            }
          }
        }
      }
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const rest = 78 + (1 - e.s) * 92
        const f = ((d - rest) / d) * 0.05 * e.s * alpha * 6
        a.vx += dx * f
        a.vy += dy * f
        b.vx -= dx * f
        b.vy -= dy * f
      }
      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.0022 * alpha
        n.vy += (cy - n.y) * 0.0022 * alpha
        n.vx *= 0.85
        n.vy *= 0.85
        n.x += n.vx
        n.y += n.vy
      }
    }

    function fireCascade() {
      const hub = hubs[Math.floor(Math.random() * hubs.length)]
      if (hub == null) return
      nodes[hub].flash = 1
      for (const { other } of incident[hub]) {
        pulses.push({
          from: hub,
          to: other,
          t: 0,
          speed: 0.012 + Math.random() * 0.006,
          hue: nodes[hub].hue,
          depth: 0,
        })
      }
    }

    let raf = 0
    let alpha = 1
    let last = performance.now()
    const t0 = last
    let nextCascade = t0 + 900

    function draw(now: number) {
      const dt = Math.min(50, now - last)
      last = now
      const elapsed = now - t0
      const introK = Math.min(1, elapsed / INTRO_MS) // 0..1 unfold progress

      if (!reduce) {
        alpha = Math.max(0.05, alpha * 0.99)
        step(0.35 + alpha)
      } else if (elapsed < 60) {
        for (let k = 0; k < 60; k++) step(0.6)
      }

      // Breathing offsets — a coherent slow drift so the whole web feels alive.
      const amp = reduce ? 0 : 3.4 * introK
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.flash *= 0.93
        ex[i] = n.x + Math.sin(now * 0.0006 + n.phase) * amp
        ey[i] = n.y + Math.cos(now * 0.0008 + n.phase * 1.3) * amp
      }

      // Background: translucent vignette each frame leaves faint comet trails.
      const bg = ctx!.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7)
      bg.addColorStop(0, 'rgba(24,14,44,0.32)')
      bg.addColorStop(1, 'rgba(6,5,16,0.42)')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)

      // --- Synapses (additive neon) ---
      ctx!.globalCompositeOperation = 'lighter'
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const boost = Math.max(a.flash, b.flash)
        const alphaLine = (0.05 + e.s * 0.14) * introK + boost * 0.4
        const grad = ctx!.createLinearGradient(ex[e.a], ey[e.a], ex[e.b], ey[e.b])
        grad.addColorStop(0, hsla(a.hue, 90, 62, alphaLine))
        grad.addColorStop(1, hsla(b.hue, 90, 62, alphaLine))
        ctx!.strokeStyle = grad
        ctx!.lineWidth = (0.5 + e.s * 1.4) * (1 + boost)
        ctx!.beginPath()
        ctx!.moveTo(ex[e.a], ey[e.a])
        ctx!.lineTo(ex[e.b], ey[e.b])
        ctx!.stroke()
      }

      // --- Signal pulses (comets that chain outward) ---
      if (!reduce) {
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i]
          p.t += p.speed * (dt / 16)
          const ax = ex[p.from]
          const ay = ey[p.from]
          const bx = ex[p.to]
          const by = ey[p.to]
          const x = ax + (bx - ax) * p.t
          const y = ay + (by - ay) * p.t
          const fade = Math.sin(Math.min(1, p.t) * Math.PI)
          const rr = 1.6 + fade * 2.2
          const g = ctx!.createRadialGradient(x, y, 0, x, y, rr * 3)
          g.addColorStop(0, hsla(p.hue, 95, 82, 0.9 * fade + 0.1))
          g.addColorStop(1, hsla(p.hue, 95, 60, 0))
          ctx!.fillStyle = g
          ctx!.beginPath()
          ctx!.arc(x, y, rr * 3, 0, Math.PI * 2)
          ctx!.fill()
          if (p.t >= 1) {
            nodes[p.to].flash = Math.min(1, nodes[p.to].flash + 0.9)
            // Chain onward through the reached node's other synapses.
            if (p.depth < 2) {
              for (const { other } of incident[p.to]) {
                if (other !== p.from && Math.random() < 0.55) {
                  pulses.push({
                    from: p.to,
                    to: other,
                    t: 0,
                    speed: 0.011 + Math.random() * 0.006,
                    hue: nodes[p.to].hue,
                    depth: p.depth + 1,
                  })
                }
              }
            }
            pulses.splice(i, 1)
          }
        }
        if (now >= nextCascade && pulses.length < 140 && introK >= 1) {
          fireCascade()
          nextCascade = now + 2600 + Math.random() * 1600
        }
      }

      // --- Nodes: additive halo + solid gradient core ---
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const x = ex[i]
        const y = ey[i]
        const pop = 1 + n.flash * 0.5
        const r = n.r * (0.4 + 0.6 * introK) * pop
        const haloR = r * (2.4 + n.flash * 1.6)
        const halo = ctx!.createRadialGradient(x, y, 0, x, y, haloR)
        const hI = (n.kind === 'category' ? 0.5 : 0.32) * introK + n.flash * 0.5
        halo.addColorStop(0, hsla(n.hue, 95, 68, hI))
        halo.addColorStop(1, hsla(n.hue, 95, 60, 0))
        ctx!.fillStyle = halo
        ctx!.beginPath()
        ctx!.arc(x, y, haloR, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalCompositeOperation = 'source-over'
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const x = ex[i]
        const y = ey[i]
        const pop = 1 + n.flash * 0.5
        const r = n.r * (0.4 + 0.6 * introK) * pop
        const core = ctx!.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
        core.addColorStop(0, hsla(n.hue, 100, 92, 1))
        core.addColorStop(0.55, hsla(n.hue, 88, 64 + n.flash * 20, 1))
        core.addColorStop(1, hsla(n.hue, 82, 44, 0.92))
        ctx!.fillStyle = core
        ctx!.beginPath()
        ctx!.arc(x, y, r, 0, Math.PI * 2)
        ctx!.fill()
        if (n.kind === 'category') {
          ctx!.beginPath()
          ctx!.arc(x, y, r + 3 + n.flash * 6, 0, Math.PI * 2)
          ctx!.strokeStyle = hsla(n.hue, 90, 80, 0.35 + n.flash * 0.5)
          ctx!.lineWidth = 1.2
          ctx!.stroke()
        }
      }

      // --- Category labels (chip + vertical de-collision) ---
      if (introK > 0.5) {
        const cats = hubs
          .map((i) => ({ i, x: ex[i], y: ey[i] - nodes[i].r - 12 }))
          .sort((a, b) => a.y - b.y)
        for (let k = 1; k < cats.length; k++) {
          if (cats[k].y - cats[k - 1].y < 16 && Math.abs(cats[k].x - cats[k - 1].x) < 90) {
            cats[k].y = cats[k - 1].y + 16
          }
        }
        ctx!.font = '600 11px ui-sans-serif, system-ui, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        for (const c of cats) {
          const label = nodes[c.i].label
          const w = ctx!.measureText(label).width + 14
          ctx!.fillStyle = 'rgba(10,8,24,0.72)'
          const rx = c.x - w / 2
          const ry = c.y - 9
          const rad = 7
          ctx!.beginPath()
          ctx!.roundRect(rx, ry, w, 18, rad)
          ctx!.fill()
          ctx!.fillStyle = hsla(nodes[c.i].hue, 60, 90, 0.95 * introK)
          ctx!.fillText(label, c.x, c.y)
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    function pick(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      let best: Sim | null = null
      let bestD = Infinity
      for (let i = 0; i < nodes.length; i++) {
        const d = (ex[i] - px) ** 2 + (ey[i] - py) ** 2
        if (d < (nodes[i].r + 9) ** 2 && d < bestD) {
          bestD = d
          best = nodes[i]
        }
      }
      if (best) {
        best.flash = Math.max(best.flash, 0.8)
        setHovered({ node: best, x: px, y: py })
      } else setHovered(null)
    }
    const onMove = (e: PointerEvent) => pick(e.clientX, e.clientY)
    const onLeave = () => setHovered(null)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [data])

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-3xl overflow-hidden"
      style={{
        height: 'min(74vh, 640px)',
        background:
          'radial-gradient(circle at 50% 40%, rgba(30,16,58,0.7), rgba(6,5,16,0.96))',
        border: '1px solid rgba(178,148,255,0.18)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 px-3 py-2 rounded-xl text-xs max-w-[220px]"
          style={{
            left: Math.min(hovered.x + 12, 999),
            top: hovered.y + 12,
            background: 'rgba(13,10,31,0.94)',
            border: `1px solid ${hsla(hovered.node.hue, 85, 70, 0.5)}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-white/90 font-medium leading-snug line-clamp-2">
            {hovered.node.label}
          </div>
          <div className="text-white/45 mt-0.5 capitalize">
            {hovered.node.kind}
            {hovered.node.er != null && (
              <span className="text-white/70"> · {hovered.node.er.toFixed(1)}% engagement</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
