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

const SITE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const INSIGHTS_JSON = join(SITE_ROOT, 'lib', 'insights.json')
const API = 'https://graph.instagram.com/v21.0'

const DRY_RUN = process.argv.includes('--dry-run')
const TOKEN = process.env.IG_ACCESS_TOKEN
if (!TOKEN) {
  console.error('IG_ACCESS_TOKEN is not set')
  process.exit(1)
}

/** GET a Graph API path, returning parsed JSON or throwing with the API error. */
async function api(path) {
  const url = `${API}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(`${path.split('?')[0]} -> ${json.error?.message || res.status}`)
  }
  return json
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

function loadPrevious() {
  try {
    return JSON.parse(readFileSync(INSIGHTS_JSON, 'utf8'))
  } catch {
    return null
  }
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
    const prev = loadPrevious()
    if (prev) {
      console.warn('followers_count missing — keeping previous insights.json')
      return
    }
  }

  writeFileSync(INSIGHTS_JSON, JSON.stringify(data, null, 2) + '\n')
  console.log(
    `insights.json updated: ${data.followersCount} followers, ` +
      `reach30=${data.reachLast30Days ?? 'n/a'}, ` +
      `onlineHours=${data.onlineFollowersByHour ? 'yes' : 'n/a'}`
  )
}

main().catch((err) => {
  // Fail-soft: log and exit 0 so the daily job / build never breaks on insights.
  console.error(`instagram-insights failed (keeping previous snapshot): ${err.message}`)
  process.exit(0)
})
