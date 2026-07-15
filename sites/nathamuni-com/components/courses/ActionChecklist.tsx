'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadItem, saveItem } from '@/lib/progress'

interface ActionChecklistProps {
  slug: string
  moduleIndex: number
  actions: string[]
}

/**
 * A tickable checklist for one module's real-world actions. Ticks persist to
 * localStorage under `course-<slug>-<moduleIndex>` so progress survives a
 * reload. SSR-safe: renders unchecked on the server and hydrates from
 * localStorage after mount, so there's nothing for reduced-motion users to
 * be bothered by (no animation here at all).
 */
/** Reads the persisted ticks for one module, or null if there's nothing (yet). */
function readChecked(storageKey: string, actions: string[]): boolean[] | null {
  try {
    const raw = loadItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return actions.map((_, i) => Boolean(parsed[i]))
  } catch {
    /* localStorage unavailable (privacy mode) — keep defaults */
  }
  return null
}

export function ActionChecklist({ slug, moduleIndex, actions }: ActionChecklistProps) {
  const storageKey = `course-${slug}-${moduleIndex}`
  const [checked, setChecked] = useState<boolean[]>(() => actions.map(() => false))

  useEffect(() => {
    const persisted = readChecked(storageKey, actions)
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating persisted ticks after mount is the point.
      setChecked(persisted)
    }
    // Re-run only when the storage key itself changes (i.e. a different module).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // A login mid-session applies server progress and fires this event so the
  // checklist re-reads localStorage instead of staying stuck on stale state.
  useEffect(() => {
    function onProgressApplied() {
      const persisted = readChecked(storageKey, actions)
      if (persisted) setChecked(persisted)
    }
    window.addEventListener('nm-progress-applied', onProgressApplied)
    return () => window.removeEventListener('nm-progress-applied', onProgressApplied)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const toggle = useCallback(
    (index: number) => {
      setChecked((prev) => {
        const next = prev.slice()
        next[index] = !next[index]
        saveItem(storageKey, JSON.stringify(next))
        return next
      })
    },
    [storageKey]
  )

  return (
    <ul className="crs-actions" data-testid="action-checklist">
      {actions.map((action, i) => {
        const id = `${storageKey}-${i}`
        return (
          <li key={id} className="crs-action-item">
            <label htmlFor={id} className="crs-action-label" data-checked={checked[i]}>
              <input
                id={id}
                type="checkbox"
                className="crs-action-checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
              />
              <span>{action}</span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
