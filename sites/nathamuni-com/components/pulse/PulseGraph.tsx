'use client'

import { useEffect, useRef, useState } from 'react'
import type { PulseGraphData, PulseNode } from '@/lib/pulse'

/**
 * Live neural-network visualization of the real content graph.
 *
 * Honest framing: this animates a force-directed layout of actual posts,
 * categories, and shared tags — node size is real engagement, edges are real
 * membership. The motion is a visualization, not live inference. The graph
 * unfolds, breathes, and occasionally a hub "fires" a signal down its strongest
 * links. It auto-fits inside the frame and is fully interactive: drag a node,
 * drag the background to pan, wheel/pinch to zoom. Respects reduced-motion.
 */

interface Sim extends PulseNode {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  z: number // depth 0.75..1.3 for subtle parallax / 3D feel
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
  const [hint, setHint] = useState(true)

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
        z: n.kind === 'category' ? 1.28 : n.kind === 'post' ? 0.95 + n.weight * 0.2 : 0.78,
        phase: (i * 1.7) % (Math.PI * 2),
        flash: 0,
      }
    })
    const edges = data.edges
      .map((e) => ({ a: idIndex.get(e.source)!, b: idIndex.get(e.target)!, s: e.strength }))
      .filter((e) => e.a != null && e.b != null)

    const incident: { edge: number; other: number }[][] = nodes.map(() => [])
    edges.forEach((e, i) => {
      incident[e.a].push({ edge: i, other: e.b })
      incident[e.b].push({ edge: i, other: e.a })
    })
    const hubs = nodes.map((n, i) => (n.kind === 'category' ? i : -1)).filter((i) => i >= 0)

    const pulses: Pulse[] = []
    const ex = new Float64Array(nodes.length)
    const ey = new Float64Array(nodes.length)

    // View transform (graph coords -> screen). Auto-fit until the user interacts.
    const view = { k: 1, tx: 0, ty: 0, userControlled: false }

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

    function autoFit(lerp: number) {
      if (view.userControlled || W === 0) return
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const n of nodes) {
        minX = Math.min(minX, n.x - n.r)
        minY = Math.min(minY, n.y - n.r)
        maxX = Math.max(maxX, n.x + n.r)
        maxY = Math.max(maxY, n.y + n.r)
      }
      const P = 46
      const gw = Math.max(1, maxX - minX)
      const gh = Math.max(1, maxY - minY)
      const k = Math.min((W - 2 * P) / gw, (H - 2 * P) / gh, 1.6)
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const tx = W / 2 - cx * k
      const ty = H / 2 - cy * k
      view.k += (k - view.k) * lerp
      view.tx += (tx - view.tx) * lerp
      view.ty += (ty - view.ty) * lerp
    }

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
            const q = (a.kind === 'category' ? 1.8 : 1) * (b.kind === 'category' ? 1.8 : 1)
            const force = ((2800 * q) / d2) * alpha
            const d = Math.sqrt(d2)
            a.vx += (dx / d) * force
            a.vy += (dy / d) * force
            b.vx -= (dx / d) * force
            b.vy -= (dy / d) * force
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
        if (n === dragNode) continue
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
      nodes[hub].flash = Math.max(nodes[hub].flash, 0.6)
      for (const { other } of incident[hub]) {
        pulses.push({
          from: hub,
          to: other,
          t: 0,
          speed: 0.012 + Math.random() * 0.005,
          hue: nodes[hub].hue,
          depth: 0,
        })
      }
    }

    let raf = 0
    let alpha = 1
    let last = performance.now()
    const t0 = last
    let nextCascade = t0 + 1400

    function draw(now: number) {
      const dt = Math.min(50, now - last)
      last = now
      const elapsed = now - t0
      const introK = Math.min(1, elapsed / INTRO_MS)

      if (!reduce) {
        alpha = Math.max(0.05, alpha * 0.99)
        step(0.35 + alpha)
      } else if (elapsed < 60) {
        for (let k = 0; k < 60; k++) step(0.6)
      }
      autoFit(elapsed < INTRO_MS ? 0.25 : 0.06)

      const amp = reduce ? 0 : 3.2 * introK
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.flash *= 0.9
        ex[i] = n.x + Math.sin(now * 0.0006 + n.phase) * amp * n.z
        ey[i] = n.y + Math.cos(now * 0.0008 + n.phase * 1.3) * amp * n.z
      }

      // Background in screen space (before view transform); faint trail.
      const bg = ctx!.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7)
      bg.addColorStop(0, 'rgba(20,12,38,0.5)')
      bg.addColorStop(1, 'rgba(6,5,16,0.6)')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)

      ctx!.save()
      ctx!.translate(view.tx, view.ty)
      ctx!.scale(view.k, view.k)

      // --- Synapses ---
      ctx!.globalCompositeOperation = 'lighter'
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const boost = Math.max(a.flash, b.flash)
        const alphaLine = (0.04 + e.s * 0.1) * introK + boost * 0.22
        const grad = ctx!.createLinearGradient(ex[e.a], ey[e.a], ex[e.b], ey[e.b])
        grad.addColorStop(0, hsla(a.hue, 85, 60, alphaLine))
        grad.addColorStop(1, hsla(b.hue, 85, 60, alphaLine))
        ctx!.strokeStyle = grad
        ctx!.lineWidth = (0.5 + e.s * 1.2) * (1 + boost * 0.6)
        ctx!.beginPath()
        ctx!.moveTo(ex[e.a], ey[e.a])
        ctx!.lineTo(ex[e.b], ey[e.b])
        ctx!.stroke()
      }

      // --- Signal pulses ---
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
          const rr = 1.4 + fade * 1.8
          const g = ctx!.createRadialGradient(x, y, 0, x, y, rr * 3)
          g.addColorStop(0, hsla(p.hue, 90, 78, 0.7 * fade + 0.1))
          g.addColorStop(1, hsla(p.hue, 90, 60, 0))
          ctx!.fillStyle = g
          ctx!.beginPath()
          ctx!.arc(x, y, rr * 3, 0, Math.PI * 2)
          ctx!.fill()
          if (p.t >= 1) {
            nodes[p.to].flash = Math.min(0.7, nodes[p.to].flash + 0.5)
            if (p.depth < 1) {
              for (const { other } of incident[p.to]) {
                if (other !== p.from && Math.random() < 0.4) {
                  pulses.push({
                    from: p.to,
                    to: other,
                    t: 0,
                    speed: 0.011 + Math.random() * 0.005,
                    hue: nodes[p.to].hue,
                    depth: p.depth + 1,
                  })
                }
              }
            }
            pulses.splice(i, 1)
          }
        }
        if (now >= nextCascade && pulses.length < 90 && introK >= 1) {
          fireCascade()
          nextCascade = now + 4200 + Math.random() * 2000
        }
      }

      // --- Node halos (additive) — depth-sorted so hubs read as closer ---
      const order = nodes.map((_, i) => i).sort((a, b) => nodes[a].z - nodes[b].z)
      for (const i of order) {
        const n = nodes[i]
        const pop = 1 + n.flash * 0.4
        const r = n.r * (0.4 + 0.6 * introK) * pop * n.z
        const haloR = r * (2.1 + n.flash * 1.1)
        const halo = ctx!.createRadialGradient(ex[i], ey[i], 0, ex[i], ey[i], haloR)
        const hI = (n.kind === 'category' ? 0.34 : 0.2) * introK + n.flash * 0.3
        halo.addColorStop(0, hsla(n.hue, 90, 66, hI))
        halo.addColorStop(1, hsla(n.hue, 90, 60, 0))
        ctx!.fillStyle = halo
        ctx!.beginPath()
        ctx!.arc(ex[i], ey[i], haloR, 0, Math.PI * 2)
        ctx!.fill()
      }
      // --- Node cores ---
      ctx!.globalCompositeOperation = 'source-over'
      for (const i of order) {
        const n = nodes[i]
        const pop = 1 + n.flash * 0.4
        const r = n.r * (0.4 + 0.6 * introK) * pop * n.z
        const core = ctx!.createRadialGradient(ex[i] - r * 0.3, ey[i] - r * 0.3, 0, ex[i], ey[i], r)
        core.addColorStop(0, hsla(n.hue, 95, 80 + n.flash * 8, 1))
        core.addColorStop(0.55, hsla(n.hue, 85, 60 + n.flash * 10, 1))
        core.addColorStop(1, hsla(n.hue, 80, 42, 0.92))
        ctx!.fillStyle = core
        ctx!.beginPath()
        ctx!.arc(ex[i], ey[i], r, 0, Math.PI * 2)
        ctx!.fill()
        if (n.kind === 'category') {
          ctx!.beginPath()
          ctx!.arc(ex[i], ey[i], r + 3 + n.flash * 4, 0, Math.PI * 2)
          ctx!.strokeStyle = hsla(n.hue, 85, 78, 0.3 + n.flash * 0.35)
          ctx!.lineWidth = 1.2 / view.k
          ctx!.stroke()
        }
      }

      // --- Category labels (chip + de-collision), in screen space for crisp text ---
      ctx!.restore()
      if (introK > 0.5) {
        const cats = hubs
          .map((i) => ({
            i,
            x: view.tx + ex[i] * view.k,
            y: view.ty + (ey[i] - nodes[i].r * nodes[i].z) * view.k - 12,
          }))
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
          ctx!.beginPath()
          ctx!.roundRect(c.x - w / 2, c.y - 9, w, 18, 7)
          ctx!.fill()
          ctx!.fillStyle = hsla(nodes[c.i].hue, 55, 88, 0.95 * introK)
          ctx!.fillText(label, c.x, c.y)
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    // ---- Interaction: hover, drag node, pan, zoom ----
    const toGraph = (px: number, py: number) => ({
      x: (px - view.tx) / view.k,
      y: (py - view.ty) / view.k,
    })
    function nodeAt(px: number, py: number): Sim | null {
      const g = toGraph(px, py)
      let best: Sim | null = null
      let bestD = Infinity
      for (let i = 0; i < nodes.length; i++) {
        const rr = nodes[i].r * nodes[i].z + 9 / view.k
        const d = (nodes[i].x - g.x) ** 2 + (nodes[i].y - g.y) ** 2
        if (d < rr * rr && d < bestD) {
          bestD = d
          best = nodes[i]
        }
      }
      return best
    }

    let dragNode: Sim | null = null
    let panning = false
    let lastX = 0
    let lastY = 0

    function relPos(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      return { px: e.clientX - rect.left, py: e.clientY - rect.top }
    }
    function onDown(e: PointerEvent) {
      const { px, py } = relPos(e)
      const n = nodeAt(px, py)
      canvas!.setPointerCapture(e.pointerId)
      setHint(false)
      if (n) {
        dragNode = n
        n.flash = Math.max(n.flash, 0.6)
      } else {
        panning = true
        view.userControlled = true
      }
      lastX = px
      lastY = py
    }
    function onMove(e: PointerEvent) {
      const { px, py } = relPos(e)
      if (dragNode) {
        const g = toGraph(px, py)
        dragNode.x = g.x
        dragNode.y = g.y
        dragNode.vx = 0
        dragNode.vy = 0
        alpha = Math.max(alpha, 0.5)
        setHovered({ node: dragNode, x: px, y: py })
        return
      }
      if (panning) {
        view.tx += px - lastX
        view.ty += py - lastY
        lastX = px
        lastY = py
        return
      }
      const n = nodeAt(px, py)
      if (n) {
        n.flash = Math.max(n.flash, 0.5)
        setHovered({ node: n, x: px, y: py })
      } else setHovered(null)
    }
    function onUp(e: PointerEvent) {
      dragNode = null
      panning = false
      try {
        canvas!.releasePointerCapture(e.pointerId)
      } catch {}
    }
    function onLeave() {
      if (!dragNode && !panning) setHovered(null)
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const { px, py } = { px: e.offsetX, py: e.offsetY }
      const g = toGraph(px, py)
      const factor = Math.exp(-e.deltaY * 0.0015)
      view.k = Math.max(0.3, Math.min(4, view.k * factor))
      view.tx = px - g.x * view.k
      view.ty = py - g.y * view.k
      view.userControlled = true
      setHint(false)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [data])

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-3xl overflow-hidden touch-none select-none"
      style={{
        height: 'min(76vh, 660px)',
        background:
          'radial-gradient(circle at 50% 40%, rgba(26,14,50,0.7), rgba(6,5,16,0.97))',
        border: '1px solid rgba(178,148,255,0.18)',
        cursor: 'grab',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {hint && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.65rem] text-white/40 tracking-wide">
          drag a node · drag background to pan · scroll to zoom
        </div>
      )}
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
