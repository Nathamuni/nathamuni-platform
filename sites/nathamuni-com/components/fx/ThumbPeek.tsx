'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ThumbPeekProps {
  /** Full image shown enlarged and uncropped in the overlay. */
  src: string
  /** Category hue for the overlay border/glow. */
  hue?: number
  /** Enable touch long-press (350ms) to open — use where tap has no preview of its own. */
  longPress?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Enlarged, uncropped preview of a thumbnail: mouse hover opens it, moving
 * away closes it; on touch (when longPress is set) press-and-hold opens it
 * and release closes it. Purely visual — clicks and navigation behave as
 * before, except the click right after a long-press, which is swallowed so
 * the peek doesn't accidentally navigate.
 */
/** Hover intent delay before the preview opens — the owner asked for 0.6s. */
const HOVER_DELAY_MS = 600
const LONG_PRESS_MS = 350

export function ThumbPeek({ src, hue = 262, longPress = false, className, children }: ThumbPeekProps) {
  const [open, setOpen] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const hoverTimer = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const clearTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  const hide = useCallback(() => {
    clearTimer()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hide])

  useEffect(() => clearTimer, [])

  return (
    <span
      className={className}
      data-testid="thumb-peek"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        hoverTimer.current = window.setTimeout(() => setOpen(true), HOVER_DELAY_MS)
      }}
      onPointerLeave={hide}
      onPointerDown={(e) => {
        if (!longPress || e.pointerType === 'mouse') return
        pressTimer.current = window.setTimeout(() => {
          suppressClick.current = true
          setOpen(true)
        }, LONG_PRESS_MS)
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          e.preventDefault()
          e.stopPropagation()
          suppressClick.current = false
        }
      }}
      onContextMenu={(e) => {
        if (open) e.preventDefault()
      }}
    >
      {children}
      {open &&
        createPortal(
          <span
            className="thumb-peek-overlay"
            style={{ '--cat': hue } as React.CSSProperties}
            aria-hidden
            data-testid="thumb-peek-overlay"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
          </span>,
          document.body
        )}
    </span>
  )
}
