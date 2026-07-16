/**
 * Consecutive-day streak from a list of ISO timestamps (metric log entries).
 * A streak counts distinct local calendar days ending today or yesterday —
 * logging at 23:50 and again at 00:10 is two days, and missing "today so far"
 * doesn't kill a streak until a full day has actually passed.
 */
export function currentStreakDays(isoDates: string[], now: Date = new Date()): number {
  const days = new Set<string>()
  for (const iso of isoDates) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) continue
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }
  if (days.size === 0) return 0

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

  // Allow the streak to start yesterday if today has no entry yet.
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (days.has(key(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
