'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AUTO_INTERVAL_MS,
  AUTO_STORAGE_KEY,
  BACKGROUNDS,
  BG_STORAGE_KEY,
  MOTIONS,
  MOTION_STORAGE_KEY,
  THEMES,
  THEME_STORAGE_KEY,
  type BackgroundId,
  type MotionId,
  type ThemeId,
} from '@/lib/themes'

/**
 * Floating colour / background / motion picker, plus "auto-change" (the colour moves to
 * the next palette every 30 seconds).
 *
 * Each choice lives on <html> (data-theme / data-bg / data-motion; the defaults are the
 * absence of the attribute) and in localStorage. A script in layout.tsx applies the saved
 * values before first paint, so this component only reads them back and changes them.
 * Storage is wrapped in try/catch because private windows and blocked site data throw.
 * Picking a colour by hand turns auto-change off: the visitor has said what they want.
 */
function readAttr<T extends string>(name: string, allowed: readonly { id: T }[], fallback: T): T {
  const v = document.documentElement.getAttribute(name)
  return allowed.some((a) => a.id === v) ? (v as T) : fallback
}

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* the choice still applies for this visit */
  }
}

function setAttr(name: string, value: string, isDefault: boolean, storageKey: string) {
  const root = document.documentElement
  if (isDefault) root.removeAttribute(name)
  else root.setAttribute(name, value)
  store(storageKey, isDefault ? null : value)
}

/** Warm the next theme's art so the crossfade lands on a painted image, not a blank. */
function preloadArt(id: ThemeId): Promise<void> {
  const suffix = id === 'violet' ? '' : `-${id}`
  const loads = ['hero-bg', 'about-portrait'].map(
    (base) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = img.onerror = () => resolve()
        img.src = `/images/generated/${base}${suffix}.jpg`
      })
  )
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000))
  return Promise.race([Promise.all(loads).then(() => undefined), timeout])
}

export function StylePicker() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeId>('violet')
  const [motion, setMotion] = useState<MotionId>('drift')
  const [bg, setBg] = useState<BackgroundId>('aurora')
  const [auto, setAuto] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Sync from the DOM / storage, which the pre-hydration script has already applied.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(readAttr('data-theme', THEMES, 'violet'))
    setMotion(readAttr('data-motion', MOTIONS, 'drift'))
    setBg(readAttr('data-bg', BACKGROUNDS, 'aurora'))
    try {
      setAuto(localStorage.getItem(AUTO_STORAGE_KEY) === '1')
    } catch {
      /* storage blocked: auto stays off */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Colour changes crossfade as a view transition where supported; reduced-motion users
  // and other browsers get an instant swap.
  const applyTheme = useCallback((id: ThemeId) => {
    const swap = () => setAttr('data-theme', id, id === 'violet', THEME_STORAGE_KEY)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown })
      .startViewTransition
    if (vt && !reduced) vt.call(document, swap)
    else swap()
    setTheme(id)
  }, [])

  useEffect(() => {
    if (!auto) return
    let cancelled = false
    const timer = window.setInterval(async () => {
      if (document.hidden) return
      const current = readAttr('data-theme', THEMES, 'violet')
      const next = THEMES[(THEMES.findIndex((t) => t.id === current) + 1) % THEMES.length].id
      await preloadArt(next)
      if (!cancelled) applyTheme(next)
    }, AUTO_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [auto, applyTheme])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  function toggleAuto() {
    const next = !auto
    setAuto(next)
    store(AUTO_STORAGE_KEY, next ? '1' : null)
  }

  return (
    <div className="style-picker" ref={rootRef} data-testid="style-picker">
      {open && (
        <div className="style-panel" role="group" aria-label="Site style">
          <p className="style-panel-title">Colour</p>
          <div className="style-swatches">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="style-swatch"
                style={{ '--swatch': t.swatch } as React.CSSProperties}
                aria-pressed={theme === t.id}
                aria-label={`${t.label} theme`}
                title={t.label}
                onClick={() => {
                  if (auto) {
                    setAuto(false)
                    store(AUTO_STORAGE_KEY, null)
                  }
                  applyTheme(t.id)
                }}
              />
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={auto}
            className="style-auto"
            onClick={toggleAuto}
          >
            <span className="style-auto-track" aria-hidden="true" />
            Change colour every {AUTO_INTERVAL_MS / 1000} seconds
          </button>

          <p className="style-panel-title">Background</p>
          <div className="style-motions">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className="style-motion"
                aria-pressed={bg === b.id}
                title={b.hint}
                onClick={() => {
                  setBg(b.id)
                  setAttr('data-bg', b.id, b.id === 'aurora', BG_STORAGE_KEY)
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <p className="style-panel-title">Motion</p>
          <div className="style-motions">
            {MOTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="style-motion"
                aria-pressed={motion === m.id}
                title={m.hint}
                onClick={() => {
                  setMotion(m.id)
                  setAttr('data-motion', m.id, m.id === 'drift', MOTION_STORAGE_KEY)
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        className="style-toggle"
        aria-expanded={open}
        aria-label="Change site style"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
          <circle cx="7.5" cy="11" r="1" />
          <circle cx="10.5" cy="7.2" r="1" />
          <circle cx="15" cy="7.8" r="1" />
        </svg>
        <span>Style</span>
      </button>
    </div>
  )
}
