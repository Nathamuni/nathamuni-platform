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

// ---------------------------------------------------------------------------
// Telegram bot command replies (used by worker/telegram.mjs). All read saved
// data only — no Instagram API calls.

const sc = (url) => (url ?? '').split(/[?#]/)[0].replace(/\/$/, '').split('/').pop()
const pct = (n) => (Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : '—')
const secs = (ms) => (Number.isFinite(ms) ? `${Math.round(ms / 1000)}s` : '—')
const link = (v) => `<a href="${escapeHtml(v.instagramUrl)}">${escapeHtml(v.title)}</a>`

function scored(videos, today, maxAge) {
  return videos
    .filter((v) => v.publishedDate && Number.isFinite(v.views))
    .map((v) => ({ ...v, age: ageDays(v.publishedDate, today) }))
    .filter((v) => v.age >= 0 && v.age <= maxAge)
}

export function renderHelp() {
  return [
    '<b>🤖 Nathamuni Insta Coach</b>',
    '',
    'Just ask “what should I post next?”, or use:',
    '/next — what to post next, with an example to copy',
    '/today — today’s report',
    '/best — top 5 reels (last 30 days)',
    '/when — best time to post',
    '/goal — pace to 50k',
    '/boost — is anything worth boosting?',
    '/reel &lt;link&gt; — stats and words of one reel',
    '/week — weekly review',
    '/ideas — 5 AI reel ideas (fresh each morning)',
    '/idea &lt;your idea&gt; — AI rates it + hook + caption',
    '/caption &lt;video details&gt; — top 3 captions + 5 hashtags',
    '/dm new — set up a comment → DM rule step by step (/dm lists them)',
    '/mute · /unmute — pause or resume reminders',
    '/cancel — stop a guided setup · /menu — refresh this command list',
    '',
    '<i>Data refreshes daily at 8 AM.</i>',
  ].join('\n')
}

/** Top reels by views in the last 30 days (shared by the text reply and the thumbnail album). */
export function topReels(videos, today, n = 5) {
  return scored(videos, today, 30)
    .sort((a, b) => b.views - a.views)
    .slice(0, n)
}

export function renderBest(videos, today, transcripts = {}) {
  const top = topReels(videos, today)
  if (!top.length) return 'No reels with stats in the last 30 days yet.'
  const lines = ['<b>🏆 Top 5 — last 30 days</b>', '']
  const max = top[0].views || 1
  top.forEach((v, i) => {
    lines.push(`${i + 1}. ${link(v)}`)
    lines.push(`   <code>${'█'.repeat(Math.max(1, Math.round((10 * v.views) / max)))}</code> ${fmt(v.views)} views`)
    lines.push(`   ${pct(v.reach ? v.shares / v.reach : NaN)} shared · ${secs(v.avgWatchTimeMs)} watched`)
    const hook = transcripts[sc(v.instagramUrl)]?.hook
    if (hook) lines.push(`   🎙 “${escapeHtml(hook.slice(0, 90))}”`)
  })
  return lines.join('\n')
}

/** Median views by IST posting window (3-hour buckets). Needs publishedAt; ignores thin buckets. */
export function postingWindows(videos, minPosts = 4) {
  const buckets = {}
  for (const v of videos) {
    if (!v.publishedAt || !Number.isFinite(v.views)) continue
    const ist = new Date(Date.parse(v.publishedAt.replace(/\+0000$/, 'Z')) + 5.5 * 3600000)
    if (Number.isNaN(ist.getTime())) continue
    const start = Math.floor(ist.getUTCHours() / 3) * 3
    ;(buckets[start] ??= []).push(v.views)
  }
  const label = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`
  return Object.entries(buckets)
    .filter(([, vs]) => vs.length >= minPosts)
    .map(([h, vs]) => ({ window: `${label(+h)}–${label((+h + 3) % 24)}`, start: +h, n: vs.length, median: median(vs) }))
    .sort((a, b) => b.median - a.median)
}

export function renderWhen(today, videos = []) {
  const dow = new Date(Date.parse(today)).getUTCDay() // 0 = Sunday
  const strong = [0, 1, 2].includes(dow)
  const lines = [
    '<b>⏰ When to post</b>',
    '',
    `• Followers most active: <b>6–9 pm IST</b>${strong ? ' (today is one of your 3 strongest days)' : ''}`,
    '• Strongest days: Tue, Mon, Sun',
  ]
  const wins = postingWindows(videos)
  if (wins.length >= 2) {
    lines.push('', '<b>Your own posts, by posting time</b> (median views)')
    for (const w of wins.slice(0, 4)) lines.push(`• ${w.window}: ${fmt(w.median)} (${w.n} posts)`)
    lines.push('', `<i>Best so far: ${wins[0].window}. Timing is one factor — topic and hook matter more.</i>`)
  } else {
    lines.push('', '<i>Your own best posting hour appears here once post times are backfilled (next sync).</i>')
  }
  return lines.join('\n')
}

export function goalStats(history, target = 50000) {
  const h = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const last = h.at(-1)
  if (!last) return null
  const ref = [...h].reverse().find((x) => Date.parse(last.date) - Date.parse(x.date) >= 14 * 86400000) ?? h[0]
  const days = Math.max(1, Math.round((Date.parse(last.date) - Date.parse(ref.date)) / 86400000))
  const perDay = (last.followers - ref.followers) / days
  const remaining = target - last.followers
  const etaDays = perDay > 0 ? Math.ceil(remaining / perDay) : null
  const eta = etaDays ? new Date(Date.parse(last.date) + etaDays * 86400000).toISOString().slice(0, 10) : null
  return { now: last.followers, perDay, remaining, etaDays, eta, window: days }
}

export function renderGoal(history) {
  const g = goalStats(history)
  if (!g) return 'No follower history yet.'
  return [
    '<b>🎯 Road to 50k</b>',
    '',
    `• Now: <b>${g.now.toLocaleString('en-IN')}</b> (${((g.now / 50000) * 100).toFixed(1)}%)`,
    `• Pace: ${g.perDay >= 0 ? '+' : ''}${g.perDay.toFixed(0)}/day (last ${g.window} days)`,
    `• To go: ${g.remaining.toLocaleString('en-IN')}`,
    g.eta ? `• At this pace: <b>${g.eta}</b> (~${Math.round(g.etaDays / 30)} months)` : '• Pace is flat — need a spike reel',
    '',
    '<i>One viral reel moves this a lot: Nov 7–9 added ~2,200 in 2 days.</i>',
  ].join('\n')
}

export function renderBoost(report) {
  const boosts = report.alerts.filter((a) => a.kind === 'boost')
  if (boosts.length) return ['<b>💸 Boost</b>', '', ...boosts.map((a) => `• ${escapeHtml(a.text)}`)].join('\n')
  return [
    '<b>💸 Boost</b>',
    '',
    `Nothing qualifies right now. Rule: a reel ≤2 days old reaching ${RULES.boostReachMultiple}× your median reach (${fmt(report.med.reach)} → ${fmt(report.med.reach * RULES.boostReachMultiple)}).`,
    '',
    'Don’t boost an average reel — boost money follows what is already working.',
  ].join('\n')
}

export function renderReel(videos, query, transcripts = {}, med = {}) {
  const code = sc(query.trim())
  const v = videos.find((x) => sc(x.instagramUrl) === code)
  if (!code || !v) return 'Send /reel followed by the reel link, e.g. /reel https://www.instagram.com/reel/ABC123/'
  const t = transcripts[code]
  const lines = [`<b>🎬 ${escapeHtml(v.title)}</b>`, `${v.publishedDate} · ${escapeHtml(v.category ?? '')}`, '']
  if (Number.isFinite(v.views)) {
    lines.push(`• Views ${fmt(v.views)}${med.views ? ` (${(v.views / med.views).toFixed(1)}× median)` : ''}`)
    lines.push(`• Reach ${fmt(v.reach)} · shared ${pct(v.reach ? v.shares / v.reach : NaN)} · saved ${fmt(v.saved)}`)
    lines.push(`• Watched ${secs(v.avgWatchTimeMs)} on average`)
  } else lines.push('• No stats stored for this one (older post).')
  if (t?.status === 'ok') {
    const body = t.english || t.text
    lines.push('', `🎙 <b>Hook:</b> “${escapeHtml(t.hook)}”`)
    lines.push(`<b>${t.english ? 'Meaning' : 'Said'}:</b> <i>${escapeHtml(body.slice(0, 700))}${body.length > 700 ? '…' : ''}</i>`)
  } else if (t?.status === 'no-speech') lines.push('', '🎵 No speech (music/visual reel).')
  else lines.push('', '🎙 Transcript not ready yet.')
  return lines.join('\n')
}

/** "What should I post next?" — rule-based until the Claude step is switched on. */
export function renderNext(report, videos, today, transcripts = {}) {
  const lines = ['<b>🎬 Post next</b>', '']
  const part2 = report.alerts.find((a) => a.kind === 'part2')
  if (part2) lines.push(`🔥 <b>First:</b> ${escapeHtml(part2.text)}`, '')

  const cat = report.pick.cat
  lines.push(`<b>Topic:</b> ${escapeHtml(cat)} (${report.pick.have} of ${report.pick.target} this week)`)
  const model = scored(videos, today, 120)
    .filter((v) => v.category === cat)
    .sort((a, b) => (b.reach ? b.shares / b.reach : 0) - (a.reach ? a.shares / a.reach : 0) || b.views - a.views)[0]
  if (model) {
    lines.push(`<b>Copy the shape of:</b> ${link(model)}`)
    lines.push(`   ${fmt(model.views)} views · ${pct(model.reach ? model.shares / model.reach : NaN)} shared`)
    const hook = transcripts[sc(model.instagramUrl)]?.hook
    if (hook) lines.push(`   It opened with: “${escapeHtml(hook.slice(0, 100))}”`)
  }
  lines.push(`<b>When:</b> ${escapeHtml(BEST_TIME)}`)
  lines.push('<b>Hook:</b> say the payoff in the first 2 seconds, in Tamil')
  lines.push('<b>End:</b> a line people forward to a friend (shares drive reach)')
  const hookAlert = report.alerts.find((a) => a.kind === 'hook')
  if (hookAlert) lines.push('', `⚠ ${escapeHtml(hookAlert.text)}`)
  lines.push('', '💡 /ideas for 5 AI reel ideas, or /idea &lt;your idea&gt; to rate yours')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Scheduled push notifications (worker cron). Rule-based, no AI, no Instagram calls.

/** 5:45 PM nudge. Returns null when a post already went out today (nothing to nag about). */
export function renderEvening(report, videos, today, transcripts = {}) {
  if (videos.some((v) => v.publishedDate === today)) return null
  const next = renderNext(report, videos, today, transcripts)
    .split('\n')
    .filter((l) => !l.startsWith('<b>🎬 Post next') && !l.includes('/ideas'))
  return ['<b>⏰ Posting window opens at 6 pm</b>', 'Not posted yet today? Here’s the plan:', ...next]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function weekStats(videos, today, fromAge, toAge) {
  return videos
    .filter((v) => v.publishedDate)
    .map((v) => ({ ...v, age: ageDays(v.publishedDate, today) }))
    .filter((v) => v.age >= fromAge && v.age < toAge)
}

export function renderWeekly(videos, history, today, transcripts = {}, ideas = null) {
  const thisWeek = weekStats(videos, today, 0, 7)
  const lastWeek = weekStats(videos, today, 7, 14)
  const h = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const at = (daysAgo) => {
    const target = new Date(Date.parse(today) - daysAgo * 86400000).toISOString().slice(0, 10)
    return [...h].reverse().find((x) => x.date <= target)?.followers ?? null
  }
  const f0 = at(0)
  const f7 = at(7)
  const f14 = at(14)
  const gainThis = f0 !== null && f7 !== null ? f0 - f7 : null
  const gainLast = f7 !== null && f14 !== null ? f7 - f14 : null

  const lines = ['<b>📅 Weekly review</b>', '']
  lines.push(
    `• Followers: <b>${gainThis === null ? '—' : (gainThis >= 0 ? '+' : '') + gainThis.toLocaleString('en-IN')}</b> this week` +
      (gainLast !== null ? ` (last week ${(gainLast >= 0 ? '+' : '') + gainLast.toLocaleString('en-IN')})` : ''),
  )
  lines.push(`• Posts: ${thisWeek.length} (last week ${lastWeek.length})`)

  const withStats = thisWeek.filter((v) => Number.isFinite(v.views)).sort((a, b) => b.views - a.views)
  if (withStats.length) {
    const best = withStats[0]
    lines.push('', `🏆 <b>Best:</b> ${link(best)} — ${fmt(best.views)} views, ${pct(best.reach ? best.shares / best.reach : NaN)} shared`)
    const hook = transcripts[sc(best.instagramUrl)]?.hook
    if (hook) lines.push(`   Opened with: “${escapeHtml(hook.slice(0, 100))}”`)
    if (withStats.length > 1) {
      const worst = withStats.at(-1)
      lines.push(`📉 <b>Weakest:</b> ${link(worst)} — ${fmt(worst.views)} views`)
    }
  }

  // Category scoreboard for the week vs the weekly mix target.
  const counts = {}
  for (const v of thisWeek) counts[v.category] = (counts[v.category] ?? 0) + 1
  lines.push('', '<b>Mix this week</b> (posted / target)')
  for (const [cat, target] of Object.entries(WEEKLY_MIX)) {
    const have = counts[cat] ?? 0
    lines.push(`• ${escapeHtml(cat)}: ${have} / ${target}${have < target ? '' : ' ✅'}`)
  }

  // One change for next week: the category furthest below target, plus the best-shared one to double down on.
  const gap = Object.entries(WEEKLY_MIX)
    .map(([cat, target]) => ({ cat, d: target - (counts[cat] ?? 0) }))
    .sort((a, b) => b.d - a.d)[0]
  const byShare = withStats.filter((v) => v.reach > 0).sort((a, b) => b.shares / b.reach - a.shares / a.reach)[0]
  lines.push('', '<b>Next week</b>')
  if (gap && gap.d > 0) lines.push(`• Add more ${escapeHtml(gap.cat)} (${gap.d} short of target)`)
  if (byShare) lines.push(`• Most shared was ${escapeHtml(byShare.category ?? 'it')} — make one more like “${escapeHtml(byShare.title)}”`)
  if (!thisWeek.length) lines.push('• No posts this week — aim for 1 a day, 6–9 pm')
  // One concrete reel for the biggest gap, in the owner's voice.
  if (gap && gap.d > 0) {
    const idea = (ideas?.ideas ?? []).find((i) => i.category === gap.cat)
    lines.push('', `💡 <b>Make one ${escapeHtml(gap.cat)} reel</b>`)
    if (idea) lines.push(`• ${escapeHtml(idea.title)}`, `  🎙 “${escapeHtml(idea.hook_tanglish)}”`)
    else lines.push('• Pick one idea from /ideas, or send yours to /idea')
    lines.push('  <i>Voice: I lift. I eat. I experiment. I share what makes sense.</i>')
  }
  return lines.join('\n')
}
