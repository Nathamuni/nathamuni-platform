'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadItem, saveItem } from '@/lib/progress'
import { dayOfSession, loadStartDate, localIsoDate } from '@/lib/sessionRun'

const MOODS = [
  { value: 1, emoji: '😖', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
] as const

interface MoodEntry {
  date: string
  mood: number
}

function moodKey(slug: string): string {
  return `metrics-mood-${slug}`
}

function loadMoods(slug: string): MoodEntry[] {
  try {
    const raw = loadItem(moodKey(slug))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e): e is MoodEntry =>
          Boolean(e) && typeof (e as MoodEntry).date === 'string' && typeof (e as MoodEntry).mood === 'number'
      )
    }
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  return []
}

function allStepsDone(slug: string, stepCount: number): boolean {
  try {
    const raw = loadItem(`session-${slug}`)
    if (!raw) return false
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return false
    for (let i = 0; i < stepCount; i++) {
      if (!parsed[i]) return false
    }
    return stepCount > 0
  } catch {
    return false
  }
}

/**
 * The reward step of the habit loop: appears only once every protocol step
 * is checked. Days-taken line + a one-tap mood check-in stored under the
 * synced `metrics-` prefix (Calm-style: the check-in itself predicts
 * next-week return). Hidden on SSR/first paint; state loads after mount.
 */
export function CompletionRitual({ slug, stepCount }: { slug: string; stepCount: number }) {
  const [done, setDone] = useState(false)
  const [todayMood, setTodayMood] = useState<number | null>(null)
  const [day, setDay] = useState<number | null>(null)

  const rehydrate = useCallback(() => {
    setDone(allStepsDone(slug, stepCount))
    const started = loadStartDate(slug)
    setDay(started ? dayOfSession(started) : null)
    const today = localIsoDate()
    setTodayMood(loadMoods(slug).find((e) => e.date === today)?.mood ?? null)
  }, [slug, stepCount])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    rehydrate()
    window.addEventListener('nm-session-steps-changed', rehydrate)
    window.addEventListener('nm-progress-applied', rehydrate)
    return () => {
      window.removeEventListener('nm-session-steps-changed', rehydrate)
      window.removeEventListener('nm-progress-applied', rehydrate)
    }
  }, [rehydrate])

  function logMood(value: number) {
    const today = localIsoDate()
    const rest = loadMoods(slug).filter((e) => e.date !== today)
    saveItem(moodKey(slug), JSON.stringify([...rest, { date: today, mood: value }]))
    setTodayMood(value)
  }

  if (!done) return null

  return (
    <section className="ssn-ritual" data-testid="completion-ritual" aria-live="polite">
      <p className="ssn-ritual-title">How do you feel?</p>
      {day !== null && <p className="ssn-ritual-days tabular-nums">Finished on day {day} of your run.</p>}
      <div className="ssn-ritual-moods" role="group" aria-label="How do you feel?">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`ssn-ritual-mood${todayMood === m.value ? ' ssn-ritual-mood-active' : ''}`}
            aria-label={m.label}
            title={m.label}
            onClick={() => logMood(m.value)}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {todayMood !== null && <p className="ssn-ritual-logged">Logged — see you tomorrow.</p>}
      <style>{`
        .ssn-ritual {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.3rem 1.4rem;
          border-radius: 1rem;
          border: 1px solid hsla(var(--cat), 70%, 60%, 0.45);
          background: hsla(var(--cat), 70%, 55%, 0.1);
        }
        .ssn-ritual-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
        }
        .ssn-ritual-days {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .ssn-ritual-moods {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ssn-ritual-mood {
          font-size: 1.3rem;
          line-height: 1;
          padding: 0.5rem 0.65rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.15s ease;
        }
        .ssn-ritual-mood:hover {
          transform: scale(1.08);
        }
        .ssn-ritual-mood-active {
          border-color: hsl(var(--cat) 80% 65%);
          background: hsla(var(--cat), 70%, 55%, 0.2);
        }
        .ssn-ritual-logged {
          margin: 0;
          font-size: 0.78rem;
          color: hsl(var(--cat) 85% 72%);
        }
        @media (prefers-reduced-motion: reduce) {
          .ssn-ritual-mood:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
