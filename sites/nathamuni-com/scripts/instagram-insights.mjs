#!/usr/bin/env node
/**
 * Instagram account insights → lib/insights.json
 *
 * Fetches account-level metrics the per-post media sync doesn't capture:
 * follower count, reach, profile views, and (best-effort) the hourly
 * "when your followers are online" breakdown that drives posting-time advice.
 *
 * Uses the same Instagram-login token as instagram-sync.mjs. Requires the
 * token to carry the `instagram_business_manage_insights` scope — regenerate
 * the token in the Meta dashboard if any insights call 400s on permissions.
 *
 * Fail-soft: on any API problem the previous lib/insights.json stays in place
 * and the site keeps building. Never throws the build.
 *
 * Usage:
 *   IG_ACCESS_TOKEN=... node scripts/instagram-insights.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { igGet, currentUsagePct, sleep, USAGE_SOFT_LIMIT } from './ig-fetch.mjs'

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const INSIGHTS_JSON = join(SITE_ROOT, 'lib', 'insights.json')
const HISTORY_JSON = join(SITE_ROOT, 'lib', 'insights-history.json')
const VIDEOS_JSON = join(SITE_ROOT, 'lib', 'videos.json')
const API = 'https://graph.instagram.com/v21.0'
// Enrich the most recent N posts each run — older posts' insights stabilize, so
// re-fetching all 165 daily would waste calls. New posts roll into this window.
const ENRICH_RECENT = 45

const DRY_RUN = process.argv.includes('--dry-run')
const TOKEN = process.env.IG_ACCESS_TOKEN
if (!TOKEN) {
  console.error('IG_ACCESS_TOKEN is not set')
  process.exit(1)
}

/** GET a Graph API path (rate-limit-aware, with backoff/retry via igGet). */
async function api(path) {
  const url = `${API}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  return igGet(url)
}

/** Best-effort single metric fetch; returns fallback (null) instead of throwing. */
async function tryMetric(label, path, extract) {
  try {
    const json = await api(path)
    return extract(json)
  } catch (err) {
    console.warn(`  skip ${label}: ${err.message}`)
    return null
  }
}

function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const shortcode = (url) => (url || '').replace(/\/+$/, '').split('/').pop()

/**
 * Enrich videos.json with per-post insights (reach/saved/shares/views + reel
 * watch time). Saves and shares are Instagram's strongest ranking signals, so
 * this upgrades the engagement model well beyond likes/comments. Fetches only
 * the most recent ENRICH_RECENT posts per run; fail-soft per media.
 */
async function enrichMediaInsights() {
  const videos = loadJson(VIDEOS_JSON, null)
  if (!Array.isArray(videos)) {
    console.warn('  skip media enrichment: videos.json unreadable')
    return
  }
  const byCode = new Map(videos.map((v) => [shortcode(v.instagramUrl), v]))

  let media
  try {
    const res = await api('me/media?fields=id,permalink,media_type,timestamp&limit=100')
    media = res.data ?? []
  } catch (err) {
    console.warn(`  skip media enrichment: ${err.message}`)
    return
  }
  media.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
  const recent = media.slice(0, ENRICH_RECENT)

  let enriched = 0
  for (const m of recent) {
    // Threshold validation: stop enriching (optional work) once we're near the
    // BUC ceiling, so the daily job never trips a hard throttle. Remaining posts
    // roll into tomorrow's window. The essential account metrics already ran.
    if (currentUsagePct() >= USAGE_SOFT_LIMIT) {
      console.log(`  media enrichment: paused at ${currentUsagePct()}% usage (soft limit) — ${enriched} done, rest deferred to next run`)
      break
    }
    const v = byCode.get(shortcode(m.permalink))
    if (!v) continue
    // Gentle pacing so a burst of insight calls doesn't spike usage.
    if (enriched > 0) await sleep(350)
    const isReel = m.media_type === 'VIDEO'
    // Request the widest safe metric set; retry with fewer if the account/media
    // type rejects one (metric availability varies by media type + API version).
    const wanted = isReel
      ? 'reach,saved,shares,views,ig_reels_avg_watch_time'
      : 'reach,saved,shares,views'
    let vals = await tryMetric(`media ${shortcode(m.permalink)}`, `${m.id}/insights?metric=${wanted}`, (j) => j.data)
    if (!vals) {
      // Fallback to the metrics every media type supports.
      vals = await tryMetric(`media ${shortcode(m.permalink)} (base)`, `${m.id}/insights?metric=reach,saved,shares`, (j) => j.data)
    }
    if (!Array.isArray(vals)) continue
    for (const metric of vals) {
      const value = metric.values?.[0]?.value ?? metric.total_value?.value
      if (typeof value !== 'number') continue
      if (metric.name === 'reach') v.reach = value
      else if (metric.name === 'saved') v.saved = value
      else if (metric.name === 'shares') v.shares = value
      else if (metric.name === 'views') v.views = value
      else if (metric.name === 'ig_reels_avg_watch_time') v.avgWatchTimeMs = value
    }
    enriched++
  }

  if (!DRY_RUN && enriched > 0) {
    writeFileSync(VIDEOS_JSON, JSON.stringify(videos, null, 2) + '\n')
  }
  console.log(`  media enrichment: ${enriched}/${recent.length} recent posts updated`)
}

/** Append today's snapshot to a growth history so followers/reach become a curve. */
function appendHistory(snapshot) {
  const history = loadJson(HISTORY_JSON, [])
  const today = snapshot.date
  const filtered = Array.isArray(history) ? history.filter((h) => h.date !== today) : []
  filtered.push(snapshot)
  filtered.sort((a, b) => a.date.localeCompare(b.date))
  if (!DRY_RUN) writeFileSync(HISTORY_JSON, JSON.stringify(filtered, null, 2) + '\n')
  return filtered.length
}

async function main() {
  // Account basics — followers_count is the denominator for every engagement rate.
  const account = await api('me?fields=followers_count,media_count,username')

  // Account reach over the trailing 30 days (total_value, one summed number).
  const reach30 = await tryMetric(
    'reach(30d)',
    'me/insights?metric=reach&period=day&metric_type=total_value',
    (j) => j.data?.[0]?.total_value?.value ?? null
  )

  // Profile views over the trailing period, if the account is eligible.
  const profileViews = await tryMetric(
    'profile_views',
    'me/insights?metric=profile_views&period=day&metric_type=total_value',
    (j) => j.data?.[0]?.total_value?.value ?? null
  )

  // "When your followers are online" — hourly (0-23, viewer's account timezone).
  // This is the real driver of posting-time advice. Availability varies by API
  // version/account; treat null as "fall back to weekday signal, don't fake it".
  const onlineFollowers = await tryMetric(
    'online_followers',
    'me/insights?metric=online_followers&period=lifetime',
    (j) => {
      const values = j.data?.[0]?.values
      if (!Array.isArray(values) || values.length === 0) return null
      // Latest snapshot: { "0": n, "1": n, ... "23": n } hour -> followers online.
      const hourly = values[values.length - 1]?.value
      return hourly && Object.keys(hourly).length ? hourly : null
    }
  )

  const data = {
    username: account.username ?? 'nathamuni_',
    followersCount: account.followers_count ?? null,
    mediaCount: account.media_count ?? null,
    reachLast30Days: reach30,
    profileViewsLast30Days: profileViews,
    // hour (0-23) -> number of followers typically online; null if API withheld it
    onlineFollowersByHour: onlineFollowers,
    fetchedAt: new Date().toISOString().slice(0, 10),
  }

  if (DRY_RUN) {
    console.log('[dry-run] insights that would be written:')
    console.log(JSON.stringify(data, null, 2))
    return
  }

  // Guard: if the critical field is missing, keep the previous good snapshot.
  if (data.followersCount == null) {
    const prev = loadJson(INSIGHTS_JSON, null)
    if (prev) {
      console.warn('followers_count missing — keeping previous insights.json')
      return
    }
  }

  if (!DRY_RUN) writeFileSync(INSIGHTS_JSON, JSON.stringify(data, null, 2) + '\n')
  console.log(
    `insights.json updated: ${data.followersCount} followers, ` +
      `reach30=${data.reachLast30Days ?? 'n/a'}, ` +
      `onlineHours=${data.onlineFollowersByHour ? 'yes' : 'n/a'}`
  )

  // Growth history — turns single-day numbers into a real curve over time.
  if (data.followersCount != null) {
    const n = appendHistory({
      date: data.fetchedAt,
      followers: data.followersCount,
      reach30: data.reachLast30Days,
      profileViews: data.profileViewsLast30Days,
    })
    console.log(`  growth history: ${n} daily snapshot(s)`)
  }

  // Per-post insights enrichment (reach/saves/shares/watch-time).
  await enrichMediaInsights()
}

main().catch((err) => {
  // Fail-soft: log and exit 0 so the daily job / build never breaks on insights.
  console.error(`instagram-insights failed (keeping previous snapshot): ${err.message}`)
  process.exit(0)
})
