'use client'

import { useCallback, useEffect, useState } from 'react'

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
export function ActionChecklist({ slug, moduleIndex, actions }: ActionChecklistProps) {
  const storageKey = `course-${slug}-${moduleIndex}`
  const [checked, setChecked] = useState<boolean[]>(() => actions.map(() => false))

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating persisted ticks after mount is the point.
        setChecked(actions.map((_, i) => Boolean(parsed[i])))
      }
    } catch {
      /* localStorage unavailable (privacy mode) — keep defaults */
    }
    // Re-run only when the storage key itself changes (i.e. a different module).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const toggle = useCallback(
    (index: number) => {
      setChecked((prev) => {
        const next = prev.slice()
        next[index] = !next[index]
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          /* ignore — nothing we can do if storage is unavailable */
        }
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
