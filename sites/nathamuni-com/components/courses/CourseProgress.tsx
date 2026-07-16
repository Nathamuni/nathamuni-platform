'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadItem } from '@/lib/progress'

/** Count ticked actions across a course's `course-<slug>-<moduleIndex>` keys. */
function countDone(slug: string, moduleActionCounts: number[]): number {
  let done = 0
  moduleActionCounts.forEach((count, moduleIndex) => {
    try {
      const raw = loadItem(`course-${slug}-${moduleIndex}`)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      for (let i = 0; i < count; i++) if (parsed[i]) done++
    } catch {
      /* malformed entry — count nothing for this module */
    }
  })
  return done
}

function useCourseProgress(slug: string, moduleActionCounts: number[]) {
  const [done, setDone] = useState(0)

  const refresh = useCallback(() => {
    setDone(countDone(slug, moduleActionCounts))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- counts are static per course build.
  }, [slug])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    refresh()
    window.addEventListener('nm-progress-applied', refresh)
    window.addEventListener('nm-course-ticked', refresh)
    return () => {
      window.removeEventListener('nm-progress-applied', refresh)
      window.removeEventListener('nm-course-ticked', refresh)
    }
  }, [refresh])

  const total = moduleActionCounts.reduce((a, b) => a + b, 0)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return { done, total, pct }
}

/**
 * Animated conic progress ring for a course hero. Fills to the real
 * percentage of ticked actions and updates live as boxes are ticked.
 */
export function CourseProgressRing({
  slug,
  moduleActionCounts,
}: {
  slug: string
  moduleActionCounts: number[]
}) {
  const { done, total, pct } = useCourseProgress(slug, moduleActionCounts)
  if (done === 0) return null

  return (
    <div className="crs-ring-wrap" data-testid="course-progress-ring">
      <div
        className="crs-ring"
        style={{ '--pct': pct } as React.CSSProperties}
        role="img"
        aria-label={`${done} of ${total} actions done (${pct}%)`}
      >
        <span className="crs-ring-value tabular-nums">{pct}%</span>
      </div>
      <span className="crs-ring-label">
        {done}/{total} actions done{pct === 100 ? ' — complete' : ''}
      </span>
    </div>
  )
}

/**
 * Compact "continue" line for course cards: a slim bar + percentage, only
 * once the visitor has actually started the course.
 */
export function CourseProgressLine({
  slug,
  moduleActionCounts,
}: {
  slug: string
  moduleActionCounts: number[]
}) {
  const { done, pct } = useCourseProgress(slug, moduleActionCounts)
  if (done === 0) return null

  return (
    <span className="crs-card-progress" data-testid="course-progress-line">
      <span className="crs-card-progress-bar" aria-hidden="true">
        <span className="crs-card-progress-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="crs-card-progress-pct tabular-nums">
        {pct === 100 ? 'Done ✓' : `${pct}% — continue`}
      </span>
    </span>
  )
}
