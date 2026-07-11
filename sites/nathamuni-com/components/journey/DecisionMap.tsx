'use client'

import { useEffect, useRef, useState } from 'react'
import type { DecisionNode } from '@/lib/journey'

const CARD_BORDER: Record<DecisionNode['hue'], string> = {
  violet: 'border-[#8b5cf6]/35',
  magenta: 'border-[#ec4899]/35',
  cyan: 'border-[#22d3ee]/35',
}

const DOT_BG: Record<DecisionNode['hue'], string> = {
  violet: 'bg-[#8b5cf6]',
  magenta: 'bg-[#ec4899]',
  cyan: 'bg-[#22d3ee]',
}

const SPINE_PATH_LENGTH = 1000

/**
 * Act II — "The decision map", the centerpiece of /journey.
 *
 * A vertical flow diagram: a gradient SVG spine that draws itself as the
 * page scrolls (stroke-dashoffset tied to scroll progress of this
 * component), with nodes alternating left/right of it on desktop and
 * stacked in a single left-spine column on mobile. Reduced-motion users get
 * the spine fully drawn immediately and no pulsing connector dots.
 */
export function DecisionMap({ nodes }: { nodes: DecisionNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Computed once, lazily, on first render — matches the pattern used by
  // HeroParallax/TiltCard elsewhere in this codebase. Avoids setting state
  // synchronously inside an effect body.
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [progress, setProgress] = useState(() => (reducedMotion ? 1 : 0))

  useEffect(() => {
    if (reducedMotion) return
    const el = containerRef.current
    if (!el) return

    let rafId = 0
    const measure = () => {
      rafId = 0
      const rect = el.getBoundingClientRect()
      const viewportH = window.innerHeight || 0
      // Progress starts once the top of the map nears the lower part of the
      // viewport, and completes once its bottom clears the upper part —
      // a comfortable "draws as you scroll through it" feel.
      const start = viewportH * 0.85
      const span = rect.height + viewportH * 0.6
      const scrolled = start - rect.top
      const pct = span > 0 ? Math.min(1, Math.max(0, scrolled / span)) : 1
      setProgress(pct)
    }
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [reducedMotion])

  const dashOffset = SPINE_PATH_LENGTH * (1 - progress)

  return (
    <div ref={containerRef} className="relative" data-testid="decision-map">
      <svg
        className="absolute top-0 left-6 sm:left-1/2 sm:-translate-x-1/2 h-full w-[3px]"
        preserveAspectRatio="none"
        viewBox="0 0 3 100"
        aria-hidden
      >
        <defs>
          <linearGradient id="jny-spine-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M1.5 0 L1.5 100" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <path
          d="M1.5 0 L1.5 100"
          stroke="url(#jny-spine-gradient)"
          strokeWidth="3"
          fill="none"
          pathLength={SPINE_PATH_LENGTH}
          style={{
            strokeDasharray: SPINE_PATH_LENGTH,
            strokeDashoffset: dashOffset,
            transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.15s linear',
          }}
        />
      </svg>

      <ol className="relative flex flex-col gap-10 sm:gap-16">
        {nodes.map((node, i) => {
          const isLeft = i % 2 === 0
          return (
            <li
              key={node.id}
              className={`relative pl-16 sm:pl-0 ${
                isLeft
                  ? 'sm:pr-[calc(50%+2.5rem)] sm:text-right'
                  : 'sm:pl-[calc(50%+2.5rem)]'
              }`}
            >
              <span
                className={`jny-dot absolute left-[1.15rem] sm:left-1/2 sm:-translate-x-1/2 top-2 h-3 w-3 rounded-full ${DOT_BG[node.hue]}`}
                data-reveal
                aria-hidden
              />
              <div
                className={`glass-card border p-5 sm:p-6 anim-fade-up ${CARD_BORDER[node.hue]}`}
                data-reveal
              >
                <p className="text-[0.65rem] uppercase tracking-widest text-white/40 mb-2">
                  {node.period}
                </p>
                <p className="text-sm text-white/65 italic mb-1.5 leading-relaxed">
                  When {node.trigger}
                </p>
                <p className="font-display text-base sm:text-lg text-white mb-1.5 leading-snug">
                  I chose: {node.decision}
                </p>
                <p className="text-sm text-white/55 leading-relaxed">→ {node.outcome}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <style>{`
        .jny-dot {
          box-shadow: 0 0 0 4px rgba(13, 10, 31, 0.9);
        }
        .jny-dot.is-visible {
          animation: jny-pulse 2.2s ease-out 1;
        }
        @keyframes jny-pulse {
          0% { box-shadow: 0 0 0 4px rgba(13, 10, 31, 0.9), 0 0 0 4px rgba(139, 92, 246, 0.45); }
          70% { box-shadow: 0 0 0 4px rgba(13, 10, 31, 0.9), 0 0 0 12px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 4px rgba(13, 10, 31, 0.9), 0 0 0 12px rgba(139, 92, 246, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jny-dot.is-visible { animation: none; }
        }
      `}</style>
    </div>
  )
}
