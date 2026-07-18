'use client'

import { useEffect, useRef, useState } from 'react'
import type { PulseGraphData, PulseNode } from '@/lib/pulse'

/**
 * Live neural-network visualization of the real content graph.
 *
 * Honest framing: this animates a force-directed layout of actual posts,
 * categories, and shared tags — node size is real engagement, edges are real
 * membership. The motion is a visualization, not live inference. It settles
 * into a stable web and fires "signal" pulses along the strongest synapses.
 * Respects prefers-reduced-motion (renders a static settled graph).
 */

interface Sim extends PulseNode {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

interface Pulse {
  edge: number
  t: number
  speed: number
}

function hueColor(hue: number, l = 65, a = 1) {
  return `hsla(${hue}, 85%, ${l}%, ${a})`
}

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
    // Seed positions deterministically in a spiral so first paint is stable.
    const nodes: Sim[] = data.nodes.map((n, i) => {
      const golden = i * 2.399963
      const rad = 30 + i * 6
      return {
        ...n,
        x: Math.cos(golden) * rad,
        y: Math.sin(golden) * rad,
        vx: 0,
        vy: 0,
        r: 4 + n.weight * (n.kind === 'category' ? 22 : n.kind === 'post' ? 11 : 6),
      }
    })
    const edges = data.edges
      .map((e) => ({ a: idIndex.get(e.source)!, b: idIndex.get(e.target)!, s: e.strength }))
      .filter((e) => e.a != null && e.b != null)

    const pulses: Pulse[] = []

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

    // --- Force simulation ---
    function step(alpha: number) {
      const cx = W / 2
      const cy = H / 2
      // Repulsion (Coulomb-ish, capped).
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy || 0.01
          const min = (a.r + b.r + 14) ** 2
          if (d2 < 90000) {
            const force = (2600 / d2) * alpha
            const d = Math.sqrt(d2)
            const fx = (dx / d) * force
            const fy = (dy / d) * force
            a.vx += fx
            a.vy += fy
            b.vx -= fx
            b.vy -= fy
            if (d2 < min) {
              // hard separation so nodes never fully overlap
              const push = ((Math.sqrt(min) - d) / d) * 0.5
              a.vx += dx * push
              a.vy += dy * push
              b.vx -= dx * push
              b.vy -= dy * push
            }
          }
        }
      }
      // Springs along edges.
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const rest = 70 + (1 - e.s) * 90
        const f = ((d - rest) / d) * 0.05 * e.s * alpha * 6
        a.vx += dx * f
        a.vy += dy * f
        b.vx -= dx * f
        b.vy -= dy * f
      }
      // Gravity to center + integrate.
      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.002 * alpha
        n.vy += (cy - n.y) * 0.002 * alpha
        n.vx *= 0.86
        n.vy *= 0.86
        n.x += n.vx
        n.y += n.vy
      }
    }

    let raf = 0
    let alpha = 1
    let last = performance.now()
    let pulseClock = 0

    function draw(now: number) {
      const dt = Math.min(50, now - last)
      last = now

      if (!reduce) {
        alpha = Math.max(0.02, alpha * 0.996)
        step(0.4 + alpha)
      } else if (alpha > 0.02) {
        // settle quickly then freeze
        for (let k = 0; k < 40; k++) step(0.6)
        alpha = 0
      }

      ctx!.clearRect(0, 0, W, H)

      // Edges
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y)
        grad.addColorStop(0, hueColor(a.hue, 60, 0.05 + e.s * 0.18))
        grad.addColorStop(1, hueColor(b.hue, 60, 0.05 + e.s * 0.18))
        ctx!.strokeStyle = grad
        ctx!.lineWidth = 0.6 + e.s * 1.1
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }

      // Spawn + advance signal pulses along strong edges.
      if (!reduce) {
        pulseClock += dt
        if (pulseClock > 90 && pulses.length < 70) {
          pulseClock = 0
          // bias toward stronger edges
          const e = Math.floor(Math.random() * edges.length)
          if (edges[e] && Math.random() < 0.3 + edges[e].s) {
            pulses.push({ edge: e, t: 0, speed: 0.006 + Math.random() * 0.01 })
          }
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i]
          p.t += p.speed * (dt / 16)
          if (p.t >= 1) {
            pulses.splice(i, 1)
            continue
          }
          const e = edges[p.edge]
          if (!e) {
            pulses.splice(i, 1)
            continue
          }
          const a = nodes[e.a]
          const b = nodes[e.b]
          const x = a.x + (b.x - a.x) * p.t
          const y = a.y + (b.y - a.y) * p.t
          const fade = Math.sin(p.t * Math.PI)
          ctx!.beginPath()
          ctx!.arc(x, y, 1.8 + fade * 1.6, 0, Math.PI * 2)
          ctx!.fillStyle = hueColor(b.hue, 78, 0.5 + fade * 0.5)
          ctx!.shadowColor = hueColor(b.hue, 78, 0.9)
          ctx!.shadowBlur = 8
          ctx!.fill()
          ctx!.shadowBlur = 0
        }
      }

      // Nodes
      const pulseGlow = reduce ? 0 : (Math.sin(now / 900) + 1) / 2
      for (const n of nodes) {
        const glow = n.kind === 'category' ? 10 + pulseGlow * 10 : n.kind === 'post' ? 6 : 3
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx!.fillStyle = hueColor(n.hue, n.kind === 'tag' ? 55 : 62, n.kind === 'category' ? 0.9 : 0.75)
        ctx!.shadowColor = hueColor(n.hue, 70, 0.9)
        ctx!.shadowBlur = glow
        ctx!.fill()
        ctx!.shadowBlur = 0
        if (n.kind === 'category') {
          ctx!.beginPath()
          ctx!.arc(n.x, n.y, n.r + 3 + pulseGlow * 3, 0, Math.PI * 2)
          ctx!.strokeStyle = hueColor(n.hue, 80, 0.4)
          ctx!.lineWidth = 1
          ctx!.stroke()
          ctx!.fillStyle = 'rgba(255,255,255,0.92)'
          ctx!.font = '600 11px ui-sans-serif, system-ui'
          ctx!.textAlign = 'center'
          ctx!.fillText(n.label, n.x, n.y - n.r - 8)
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    // --- Hover / tap tooltip ---
    function pick(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      let best: Sim | null = null
      let bestD = Infinity
      for (const n of nodes) {
        const d = (n.x - px) ** 2 + (n.y - py) ** 2
        if (d < (n.r + 8) ** 2 && d < bestD) {
          bestD = d
          best = n
        }
      }
      if (best) setHovered({ node: best, x: px, y: py })
      else setHovered(null)
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
        height: 'min(72vh, 620px)',
        background:
          'radial-gradient(circle at 50% 40%, rgba(40,20,70,0.55), rgba(8,6,20,0.9))',
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
            border: `1px solid ${hueColor(hovered.node.hue, 70, 0.5)}`,
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
