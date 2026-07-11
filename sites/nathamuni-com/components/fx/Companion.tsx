'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

type Character = 'kitty' | 'spark' | 'off'

const STORAGE_KEY = 'companion-choice'
const DEFAULT_CHARACTER: Character = 'kitty'
const MOBILE_BREAKPOINT = 640
const MOBILE_BASELINE = 72
const DESKTOP_BASELINE = 24
// Bottom lane: how far the character's lowest edge is ever allowed to sit
// from the viewport's true bottom, on any axis of movement (idle / seek /
// sit / scamper). Desktop stays tight; mobile leaves room for the tab bar.
const DESKTOP_LANE_BAND = 90
const MOBILE_LANE_BAND = 150
// Horizontal clearance kept free of the bottom-right character picker so the
// wandering/seeking/scampering character never settles under its own button.
const PICKER_CLEARANCE = 76
const NOTICE_RADIUS = 260
const POINTER_STOP_MS = 220
const IGNORE_TIMEOUT_MS = 8000
const CHAR_SIZE: Record<Character, number> = { kitty: 56, spark: 52, off: 56 }

interface XY {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Clamp a Y coordinate into the bottom lane for the given viewport/size. */
function laneY(y: number, size: number, mobile: boolean) {
  const vh = window.innerHeight
  const band = mobile ? MOBILE_LANE_BAND : DESKTOP_LANE_BAND
  return clamp(y, vh - band - size, vh - size)
}

/** Rightmost X the character may occupy, leaving the picker button clear. */
function maxX(vw: number, size: number) {
  return Math.max(4, vw - size - PICKER_CLEARANCE)
}

function isCharacter(value: string | null): value is Character {
  return value === 'kitty' || value === 'spark' || value === 'off'
}

interface EyeRefs {
  uid: string
  pupilRefs: React.MutableRefObject<Array<SVGCircleElement | null>>
  eyeRefs: React.MutableRefObject<Array<SVGGElement | null>>
  reducedMotion: boolean
}

interface KittySvgProps extends EyeRefs {
  tailRef: React.MutableRefObject<SVGPathElement | null>
}

/**
 * Small vector cat: rounded body, triangle ears with an inner-ear accent,
 * a swishable tail, and two tracked pupils. The body is a living
 * violet→magenta→cyan gradient with a slow rotating sweep and a soft
 * blurred glow duplicate behind it for extra vibrancy.
 */
function KittySvg({ uid, pupilRefs, eyeRefs, tailRef, reducedMotion }: KittySvgProps) {
  const gradId = `cmp-kitty-grad-${uid}`
  const glowId = `cmp-kitty-glow-${uid}`
  return (
    <svg width={56} height={56} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#22d3ee" />
          {!reducedMotion && (
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from="0 32 32"
              to="360 32 32"
              dur="8s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <ellipse cx="30" cy="46" rx="24" ry="18" fill={`url(#${gradId})`} opacity={0.5} filter={`url(#${glowId})`} />
      <circle cx="32" cy="28" r="19" fill={`url(#${gradId})`} opacity={0.45} filter={`url(#${glowId})`} />
      <path
        ref={tailRef}
        className="cmp-tail"
        d="M50 46 C 63 42, 63 24, 50 18"
        stroke={`url(#${gradId})`}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        style={{ transformBox: 'fill-box', transformOrigin: '0% 100%' }}
      />
      <ellipse cx="30" cy="46" rx="20" ry="14" fill={`url(#${gradId})`} />
      <path d="M18 18 L14 4 L28 16 Z" fill="#8b5cf6" />
      <path d="M46 18 L50 4 L36 16 Z" fill="#8b5cf6" />
      <path d="M20 14 L18 7 L24 14 Z" fill="#22d3ee" />
      <path d="M44 14 L46 7 L40 14 Z" fill="#22d3ee" />
      <circle cx="32" cy="28" r="16" fill={`url(#${gradId})`} />
      {[26, 38].map((cx, i) => (
        <g
          key={cx}
          ref={(el) => {
            eyeRefs.current[i] = el
          }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <circle cx={cx} cy="27" r="4.8" fill="#ffffff" />
          <circle cx={cx} cy="27" r="4.8" fill="none" stroke="#22d3ee" strokeOpacity={0.55} strokeWidth={0.6} />
          <circle
            ref={(el) => {
              pupilRefs.current[i] = el
            }}
            cx={cx}
            cy="27"
            r="2.1"
            fill="#0d0a1f"
          />
        </g>
      ))}
      <g stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.8} strokeLinecap="round">
        <path d="M12 30 L2 28" />
        <path d="M12 33 L2 34" />
        <path d="M52 30 L62 28" />
        <path d="M52 33 L62 34" />
      </g>
    </svg>
  )
}

/**
 * Glowing aurora orb: soft blurred halo behind a richer four-stop
 * cyan→violet→magenta sphere that gently pulses, with two tracked
 * eye-glints.
 */
function SparkSvg({ uid, pupilRefs, eyeRefs, reducedMotion }: EyeRefs) {
  const gradId = `cmp-spark-grad-${uid}`
  const blurId = `cmp-spark-blur-${uid}`
  return (
    <svg width={52} height={52} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="35%" stopColor="#22d3ee" />
          <stop offset="65%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>
        <filter id={blurId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={4.5} />
        </filter>
      </defs>
      <circle cx="30" cy="30" r="22" fill={`url(#${gradId})`} opacity={0.55} filter={`url(#${blurId})`}>
        {!reducedMotion && (
          <animate attributeName="r" values="22;25;22" dur="3.2s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="30" cy="30" r="17" fill={`url(#${gradId})`} />
      {[24, 36].map((cx, i) => (
        <g
          key={cx}
          ref={(el) => {
            eyeRefs.current[i] = el
          }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <circle cx={cx} cy="29" r="3.4" fill="#0d0a1f" opacity={0.85} />
          <circle
            ref={(el) => {
              pupilRefs.current[i] = el
            }}
            cx={cx}
            cy="29"
            r="1.5"
            fill="#ffffff"
          />
        </g>
      ))}
    </svg>
  )
}

const CSS = `
.cmp-root {
  position: fixed;
  inset: auto 0 0 0;
  pointer-events: none;
  z-index: 40;
}
.cmp-character {
  pointer-events: none;
}
.cmp-art {
  display: block;
}
.cmp-picker-wrap {
  position: fixed;
  right: 16px;
  bottom: 16px;
  pointer-events: auto;
}
@media (max-width: 639px) {
  .cmp-picker-wrap {
    bottom: 88px;
  }
}
.cmp-picker-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(139, 92, 246, 0.35);
  background: rgba(13, 10, 31, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(139, 92, 246, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.cmp-picker-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(236, 72, 153, 0.4);
}
.cmp-menu {
  position: absolute;
  right: 0;
  bottom: 52px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  background: rgba(13, 10, 31, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(13, 10, 31, 0.45);
}
.cmp-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f3ff;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.cmp-menu-item:hover {
  background: rgba(139, 92, 246, 0.25);
}
.cmp-menu-item[aria-checked='true'] {
  border-color: #22d3ee;
  background: rgba(34, 211, 238, 0.18);
}
`

/**
 * A tiny, user-selectable animated companion (Kitty / Spark / Off) that
 * wanders the bottom edge of the viewport, notices the pointer, reacts to
 * clicks/taps, and stays out of the way of input. Pure client-side, static-
 * export friendly, and reduced-motion safe.
 */
export function Companion() {
  const uid = useId().replace(/[:]/g, '')
  const [mounted, setMounted] = useState(false)
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const charRef = useRef<HTMLDivElement | null>(null)
  const artRef = useRef<HTMLDivElement | null>(null)
  const pupilRefs = useRef<Array<SVGCircleElement | null>>([])
  const eyeRefs = useRef<Array<SVGGElement | null>>([])
  const tailRef = useRef<SVGPathElement | null>(null)
  const pickerWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe mount flag: renders null until the client effect commits.
    setMounted(true)
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isCharacter(stored)) setCharacter(stored)
    } catch {
      /* localStorage unavailable (privacy mode) — keep default */
    }

    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(reduceMq.matches)
    const onReduceChange = () => setReducedMotion(reduceMq.matches)
    reduceMq.addEventListener('change', onReduceChange)

    const updateIsMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile, { passive: true })

    return () => {
      reduceMq.removeEventListener('change', onReduceChange)
      window.removeEventListener('resize', updateIsMobile)
    }
  }, [])

  const selectCharacter = useCallback((next: Character) => {
    setCharacter(next)
    setMenuOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (!pickerWrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Behavior engine: a single rAF loop driving transform-only movement,
  // pointer awareness, click/tap reactions, blink/tail/bob oscillators,
  // and scroll-peek on mobile. Skipped entirely for "off" and for
  // reduced-motion users (who get a static, sitting character instead).
  useEffect(() => {
    if (!mounted || character === 'off' || reducedMotion) return
    const charEl = charRef.current
    const artEl = artRef.current
    if (!charEl || !artEl) return

    const size = CHAR_SIZE[character]

    const baselineY = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      return window.innerHeight - (mobile ? MOBILE_BASELINE : DESKTOP_BASELINE) - size
    }

    const state = {
      pos: { x: Math.max(0, window.innerWidth * 0.15), y: baselineY() } as XY,
      vel: { x: 0, y: 0 } as XY,
      target: { x: 0, y: 0 } as XY,
      facing: 1,
      mode: 'idle' as 'idle' | 'seeking' | 'sitting' | 'scamper',
      wanderAt: 0,
      pauseUntil: 0,
      blinkAt: performance.now() + 2000 + Math.random() * 3000,
      blinking: false,
      blinkStart: 0,
      tailPhase: 0,
      bobPhase: Math.random() * Math.PI * 2,
      hopping: false,
      hopStart: 0,
      hasMouse: false,
      pointer: { x: -9999, y: -9999 } as XY,
      lastPointerMoveAt: 0,
      sitSince: 0,
      peekX: 0,
      lastScrollY: window.scrollY,
      // Raw (unclamped) point the character should visually gaze toward,
      // e.g. a click far up the page — the body stays in its lane but the
      // eyes/head tilt up toward it.
      gazeAt: null as XY | null,
    }

    const pickWanderTarget = () => {
      const vw = window.innerWidth
      const mobile = vw < MOBILE_BREAKPOINT
      state.target = { x: clamp(Math.random() * vw, 4, maxX(vw, size)), y: laneY(baselineY(), size, mobile) }
    }
    state.target = { x: state.pos.x, y: state.pos.y }
    pickWanderTarget()

    charEl.style.transform = `translate3d(${state.pos.x}px, ${state.pos.y}px, 0)`

    let raf = 0
    let last = performance.now()

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      state.hasMouse = true
      state.pointer = { x: e.clientX, y: e.clientY }
      state.lastPointerMoveAt = performance.now()
    }

    const onDocClick = (e: MouseEvent) => {
      if (pickerWrapRef.current?.contains(e.target as Node)) return
      const vw = window.innerWidth
      const mobile = vw < MOBILE_BREAKPOINT
      state.mode = 'scamper'
      state.hopping = false
      state.gazeAt = { x: e.clientX, y: e.clientY }
      state.target = {
        x: clamp(e.clientX - size / 2, 0, maxX(vw, size)),
        y: laneY(e.clientY - size / 2, size, mobile),
      }
      // Near-instant start: kick velocity toward the target immediately
      // instead of waiting for the spring to build up from rest.
      const dirX = state.target.x - state.pos.x
      const dirY = state.target.y - state.pos.y
      const dist = Math.hypot(dirX, dirY) || 1
      const kick = 7
      state.vel.x = (dirX / dist) * kick
      state.vel.y = (dirY / dist) * kick
    }

    const onScroll = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) return
      const dy = window.scrollY - state.lastScrollY
      state.lastScrollY = window.scrollY
      if (Math.abs(dy) < 2) return
      state.peekX = clamp(state.peekX + (dy > 0 ? 10 : -10), -18, 18)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('click', onDocClick, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) {
        last = now
        return
      }
      const dt = Math.min(now - last, 48) / 16.67
      last = now

      const vw = window.innerWidth
      const mobile = vw < MOBILE_BREAKPOINT

      if (state.mode === 'idle') {
        if (state.hasMouse && now - state.lastPointerMoveAt > POINTER_STOP_MS) {
          const dx = state.pointer.x - (state.pos.x + size / 2)
          const dy = state.pointer.y - (state.pos.y + size / 2)
          if (Math.hypot(dx, dy) < NOTICE_RADIUS) {
            state.mode = 'seeking'
            state.target = {
              x: clamp(state.pointer.x - size * 0.7, 0, maxX(vw, size)),
              y: laneY(state.pointer.y - size * 0.4, size, mobile),
            }
          }
        }
        if (now >= state.wanderAt && now >= state.pauseUntil) {
          pickWanderTarget()
          state.wanderAt = now + 4000 + Math.random() * 5000
          if (Math.random() < 0.35) state.pauseUntil = now + 800 + Math.random() * 1500
        }
      } else if (state.mode === 'seeking') {
        const dist = Math.hypot(state.target.x - state.pos.x, state.target.y - state.pos.y)
        if (dist < 6) {
          state.mode = 'sitting'
          state.sitSince = now
        }
      } else if (state.mode === 'sitting') {
        if (now - state.sitSince > IGNORE_TIMEOUT_MS) {
          state.mode = 'idle'
          state.wanderAt = now
        } else if (state.hasMouse && now - state.lastPointerMoveAt < 60) {
          const nextTarget = {
            x: clamp(state.pointer.x - size * 0.7, 0, maxX(vw, size)),
            y: laneY(state.pointer.y - size * 0.4, size, mobile),
          }
          const moved = Math.hypot(nextTarget.x - state.pos.x, nextTarget.y - state.pos.y)
          state.target = nextTarget
          if (moved > 30) state.mode = 'seeking'
        }
      } else if (state.mode === 'scamper') {
        const dist = Math.hypot(state.target.x - state.pos.x, state.target.y - state.pos.y)
        if (dist < 5 && !state.hopping) {
          state.hopping = true
          state.hopStart = now
        }
        if (state.hopping && now - state.hopStart > 320) {
          state.hopping = false
          state.mode = 'idle'
          state.wanderAt = now + 1200
          state.gazeAt = null
        }
      }

      const springK = state.mode === 'scamper' ? 0.05 : state.mode === 'seeking' ? 0.022 : 0.008
      const damping = state.mode === 'scamper' ? 0.7 : state.mode === 'seeking' ? 0.78 : 0.86
      const targetY = state.mode === 'idle' ? laneY(baselineY(), size, mobile) : state.target.y
      const ax = (state.target.x - state.pos.x) * springK
      const ay = (targetY - state.pos.y) * springK
      state.vel.x = (state.vel.x + ax * dt) * damping
      state.vel.y = (state.vel.y + ay * dt) * damping
      state.pos.x = clamp(state.pos.x + state.vel.x * dt, 0, maxX(vw, size))
      state.pos.y = laneY(state.pos.y + state.vel.y * dt, size, mobile)

      if (Math.abs(state.vel.x) > 0.15) state.facing = state.vel.x > 0 ? 1 : -1

      let bob = 0
      if (state.mode === 'idle' && !state.hopping) {
        state.bobPhase += 0.05 * dt
        bob = Math.sin(state.bobPhase) * 2
      }

      let hop = 0
      if (state.hopping) {
        const t = clamp((now - state.hopStart) / 320, 0, 1)
        hop = -Math.sin(t * Math.PI) * 14
      }

      state.peekX *= Math.pow(0.94, dt)

      const finalX = state.pos.x + state.peekX
      const finalY = state.pos.y + bob + hop
      charEl.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`

      state.tailPhase += (state.mode === 'scamper' ? 0.18 : 0.045) * dt
      if (tailRef.current) {
        tailRef.current.style.transform = `rotate(${Math.sin(state.tailPhase) * 14}deg)`
      }

      if (!state.blinking && now >= state.blinkAt) {
        state.blinking = true
        state.blinkStart = now
      }
      if (state.blinking) {
        const t = now - state.blinkStart
        const scale = t < 60 ? 1 - t / 60 : t < 120 ? (t - 60) / 60 : 1
        eyeRefs.current.forEach((g) => {
          if (g) g.style.transform = `scaleY(${clamp(scale, 0.05, 1)})`
        })
        if (t > 120) {
          state.blinking = false
          state.blinkAt = now + 2200 + Math.random() * 3200
        }
      }

      // While scampering toward a click that landed above the lane, the
      // body stays clamped to the bottom but the gaze (and a slight head
      // tilt) still points up at the actual click position.
      const lookAt =
        state.mode === 'scamper' && state.gazeAt
          ? state.gazeAt
          : state.hasMouse
            ? state.pointer
            : { x: finalX + size / 2 + state.facing * 40, y: finalY }
      const eyeCenterX = finalX + size / 2
      const eyeCenterY = finalY + size * 0.35
      const dx = clamp(lookAt.x - eyeCenterX, -60, 60)
      const dy = clamp(lookAt.y - eyeCenterY, -60, 60)
      const mag = Math.hypot(dx, dy) || 1
      const maxOffset = character === 'kitty' ? 1.6 : 2.2
      const offset = Math.min(maxOffset, mag / 20)
      const px = (dx / mag) * offset
      const py = (dy / mag) * offset
      pupilRefs.current.forEach((p) => {
        if (p) p.setAttribute('transform', `translate(${px.toFixed(2)}, ${py.toFixed(2)})`)
      })

      const tilt = clamp((eyeCenterY - lookAt.y) / 25, -1, 1) * 8
      artEl.style.transform = `scaleX(${state.facing}) rotate(${tilt}deg)`
    }

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('scroll', onScroll)
    }
  }, [mounted, character, reducedMotion])

  if (!mounted) return null

  const showCharacter = character !== 'off'

  return (
    <div className="cmp-root" data-testid="companion-root">
      <style>{CSS}</style>

      {showCharacter && (
        <div
          ref={charRef}
          className="cmp-character"
          data-testid="companion-character"
          data-character={character}
          data-reduced={reducedMotion ? 'true' : 'false'}
          aria-hidden="true"
          style={
            reducedMotion
              ? {
                  position: 'fixed',
                  left: 16,
                  bottom: isMobile ? MOBILE_BASELINE : DESKTOP_BASELINE,
                }
              : { position: 'fixed', left: 0, top: 0, willChange: 'transform' }
          }
        >
          <div ref={artRef} className="cmp-art">
            {character === 'kitty' ? (
              <KittySvg
                uid={uid}
                pupilRefs={pupilRefs}
                eyeRefs={eyeRefs}
                tailRef={tailRef}
                reducedMotion={reducedMotion}
              />
            ) : (
              <SparkSvg uid={uid} pupilRefs={pupilRefs} eyeRefs={eyeRefs} reducedMotion={reducedMotion} />
            )}
          </div>
        </div>
      )}

      <div className="cmp-picker-wrap" ref={pickerWrapRef}>
        <button
          type="button"
          className="cmp-picker-btn"
          aria-label="Choose companion"
          aria-expanded={menuOpen}
          data-testid="companion-picker-button"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{character === 'kitty' ? '🐱' : character === 'spark' ? '✨' : '💤'}</span>
        </button>

        {menuOpen && (
          <div className="cmp-menu" role="menu" data-testid="companion-menu">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={character === 'kitty'}
              className="cmp-menu-item"
              onClick={() => selectCharacter('kitty')}
            >
              <span aria-hidden="true">🐱</span> Kitty
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={character === 'spark'}
              className="cmp-menu-item"
              onClick={() => selectCharacter('spark')}
            >
              <span aria-hidden="true">✨</span> Spark
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={character === 'off'}
              className="cmp-menu-item"
              onClick={() => selectCharacter('off')}
            >
              <span aria-hidden="true">💤</span> Off
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
