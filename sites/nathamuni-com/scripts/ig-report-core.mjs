// Pure rules for the daily Instagram report (no I/O — see ig-daily-report.mjs).
// Thresholds come from the 2026-11-19 analysis of this account's own posts;
// tune them here as the account grows.

export const RULES = {
  part2Views: 15000, // a post this big earns a follow-up
  part2MaxAgeDays: 3,
  boostReachMultiple: 2.5, // reach vs the account median, in the first 2 days
  boostMaxAgeDays: 2,
  weakViews: 5000, // 3 settled reels in a row under this → change the hook
  settledAgeDays: 2, // views mostly land in the first 48h
  postingGapDays: 2,
  baselineDays: 90,
}

// Weekly content mix from the analysis (posts per week).
export const WEEKLY_MIX = {
  'Humor & Tamil': 2,
  'Calisthenics & Fitness': 2.5,
  'Life & Moments': 1,
  'Mind & Discipline': 0.5,
  'AI & Builds': 0.5,
}

export const BEST_TIME = '6–9 pm IST (Tue, Mon, Sun strongest)'

const DAY = 86400000

export function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!s.length) return null
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function ageDays(publishedDate, today) {
  return Math.round((Date.parse(today) - Date.parse(publishedDate.slice(0, 10))) / DAY)
}

/** Today's date (YYYY-MM-DD) in IST. */
export function istToday(now = new Date()) {
  return new Date(now.getTime() + 5.5 * 3600000).toISOString().slice(0, 10)
}

function followerDelta(history, today, days) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1)
  if (!latest) return null
  const target = new Date(Date.parse(latest.date) - days * DAY).toISOString().slice(0, 10)
  const past = [...sorted].reverse().find((h) => h.date <= target)
  return past ? latest.followers - past.followers : null
}

export function buildReport({ videos, insights, history, today }) {
  const withAge = videos
    .filter((v) => v.publishedDate)
    .map((v) => ({ ...v, age: ageDays(v.publishedDate, today) }))
    .filter((v) => v.age >= 0)

  const baseline = withAge.filter(
    (v) => v.age <= RULES.baselineDays && v.age >= RULES.settledAgeDays && Number.isFinite(v.views),
  )
  const med = {
    views: median(baseline.map((v) => v.views)),
    reach: median(baseline.map((v) => v.reach)),
    shareRate: median(baseline.filter((v) => v.reach > 0).map((v) => v.shares / v.reach)),
    watchMs: median(baseline.map((v) => v.avgWatchTimeMs)),
  }

  const latestHist = [...history].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const followers = {
    now: insights?.followersCount ?? latestHist?.followers ?? null,
    d1: followerDelta(history, today, 1),
    d7: followerDelta(history, today, 7),
  }

  const alerts = []

  for (const v of withAge) {
    if (v.age <= RULES.part2MaxAgeDays && v.views >= RULES.part2Views) {
      alerts.push({
        kind: 'part2',
        post: v,
        text: `Make a Part 2 of “${v.title}” within 48h (${fmt(v.views)} views). Same format, same hook style.`,
      })
    }
    if (
      v.age <= RULES.boostMaxAgeDays &&
      med.reach &&
      v.reach >= RULES.boostReachMultiple * med.reach
    ) {
      alerts.push({
        kind: 'boost',
        post: v,
        text: `Boost candidate: “${v.title}” reached ${fmt(v.reach)} (${(v.reach / med.reach).toFixed(1)}× your median). Test a small boost (₹200–400), only if it’s ≤60s and 9:16.`,
      })
    }
  }

  const settledReels = withAge
    .filter((v) => v.mediaType === 'reel' && v.age >= RULES.settledAgeDays && Number.isFinite(v.views))
    .sort((a, b) => a.age - b.age)
    .slice(0, 3)
  if (settledReels.length === 3 && settledReels.every((v) => v.views < RULES.weakViews)) {
    alerts.push({
      kind: 'hook',
      text: `Last 3 reels all under ${fmt(RULES.weakViews)} views. Change the hook (first 2 seconds), not the topic.`,
    })
  }

  const lastPostAge = withAge.length ? Math.min(...withAge.map((v) => v.age)) : null
  if (lastPostAge !== null && lastPostAge >= RULES.postingGapDays) {
    alerts.push({ kind: 'gap', text: `No post in ${lastPostAge} days. Post today.` })
  }

  // What to post today: the category furthest below its weekly target.
  const week = withAge.filter((v) => v.age < 7)
  const counts = Object.fromEntries(Object.keys(WEEKLY_MIX).map((c) => [c, 0]))
  for (const v of week) if (v.category in counts) counts[v.category]++
  const pick = Object.entries(WEEKLY_MIX)
    .map(([cat, target]) => ({ cat, target, have: counts[cat], deficit: target - counts[cat] }))
    .sort((a, b) => b.deficit - a.deficit || b.target - a.target)[0]

  // Best and worst recent posts (last 7 days, with stats).
  const recent = week
    .filter((v) => Number.isFinite(v.views))
    .sort((a, b) => b.views - a.views)
  const top = recent[0] ?? null

  // Did the newest settled reel hold attention?
  const lastReel = settledReels[0]
  let watchNote = null
  if (lastReel?.avgWatchTimeMs && med.watchMs) {
    const r = lastReel.avgWatchTimeMs / med.watchMs
    watchNote =
      r >= 1.2
        ? `“${lastReel.title}” held attention ${r.toFixed(1)}× longer than usual. Reuse its opening.`
        : r <= 0.8
          ? `“${lastReel.title}” lost viewers early (${(lastReel.avgWatchTimeMs / 1000).toFixed(0)}s avg vs ${(med.watchMs / 1000).toFixed(0)}s). Tighten the first 3 seconds.`
          : null
  }

  return { today, followers, med, alerts, pick, counts, top, recent, watchNote }
}

export function fmt(n) {
  if (!Number.isFinite(n)) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n))
}

function signed(n) {
  if (n === null || n === undefined) return '—'
  return `${n >= 0 ? '+' : ''}${n.toLocaleString('en-IN')}`
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Telegram HTML message (parse_mode=HTML), kept well under the 4096-char limit. */
export function renderTelegram(r) {
  const e = escapeHtml
  const lines = []
  lines.push(`<b>📊 Instagram — ${r.today}</b>`)
  lines.push(
    `Followers <b>${(r.followers.now ?? 0).toLocaleString('en-IN')}</b>  (${signed(r.followers.d1)} today, ${signed(r.followers.d7)} this week)`,
  )
  lines.push('')

  if (r.alerts.length) {
    lines.push('<b>⚡ Act on</b>')
    for (const a of r.alerts) lines.push(`• ${e(a.text)}`)
    lines.push('')
  }

  lines.push('<b>🎬 Post today</b>')
  lines.push(
    `• ${e(r.pick.cat)} (${r.pick.have} of ${r.pick.target} this week)`,
  )
  lines.push(`• Time: ${e(BEST_TIME)}`)
  lines.push('• Aim for shares: end with a line people send to a friend')
  lines.push('')

  if (r.top) {
    const t = r.top
    const sr = t.reach ? ((t.shares / t.reach) * 100).toFixed(2) : null
    lines.push('<b>🏆 Best this week</b>')
    lines.push(
      `• <a href="${e(t.instagramUrl)}">${e(t.title)}</a>: ${fmt(t.views)} views` +
        (r.med.views ? ` (${(t.views / r.med.views).toFixed(1)}× median)` : '') +
        (sr ? `, ${sr}% shared` : ''),
    )
    lines.push('')
  }
  if (r.watchNote) {
    lines.push('<b>👀 Watch time</b>')
    lines.push(`• ${e(r.watchNote)}`)
    lines.push('')
  }

  lines.push(
    `<i>Your median: ${fmt(r.med.views)} views · ${fmt(r.med.reach)} reach · ${r.med.shareRate ? (r.med.shareRate * 100).toFixed(2) : '—'}% shared</i>`,
  )
  return lines.join('\n')
}
