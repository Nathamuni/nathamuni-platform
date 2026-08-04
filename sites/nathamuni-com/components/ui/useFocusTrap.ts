'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Traps Tab focus inside a modal container and restores it to whatever was focused
 * before the modal opened.
 *
 * The site's four dialogs (TheaterMode, AccountWidget, MomentsWall lightbox and the
 * Pulse drill-down) all declared role="dialog" and handled Escape, but none trapped
 * focus or restored it — so keyboard users tabbed straight out of the dialog into
 * the page behind it (WCAG 2.4.3 / 2.1.2).
 *
 * Deliberately a small local hook rather than a component library: swapping in a
 * third-party Dialog would have rewritten the markup, styling and portal behaviour
 * of four working components. This changes only focus behaviour.
 *
 * Takes the caller's own ref rather than creating one, because three of the four
 * dialogs already put a ref on their container for other purposes.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null)
 *   useFocusTrap(ref, isOpen)
 *   <div ref={ref} role="dialog" aria-modal="true"> ... </div>
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  active: boolean = true
) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Deliberately does NOT filter on offsetParent: it is null for position:fixed
    // elements, which is exactly what these dialogs are, so that check would find
    // no focusables and the trap would silently do nothing. Filter on explicit
    // hidden semantics instead, which is also what jsdom can model.
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]')
      )

    // Move focus in. Prefer the first focusable; fall back to the container itself
    // so screen readers announce the dialog rather than leaving focus outside it.
    const initial = focusables()[0]
    if (initial) {
      initial.focus()
    } else {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (e.shiftKey && (current === first || !container.contains(current))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Restore focus only if it is still inside the dialog being torn down;
      // otherwise something else has deliberately claimed it.
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [active, containerRef])
}
