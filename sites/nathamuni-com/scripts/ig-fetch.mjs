/**
 * Rate-limit-aware fetch for the Instagram Platform API.
 *
 * Instagram uses Business Use Case (BUC) rate limits: the 24h call budget is
 * roughly 4800 × (impressions in the last 24h), so a smaller account has a low,
 * "unpredictable" ceiling. Meta reports usage in two headers:
 *   - X-App-Usage:               { call_count, total_cputime, total_time }  (0-100%)
 *   - X-Business-Use-Case-Usage: { <id>: [{ type, call_count, total_cputime,
 *                                  total_time, estimated_time_to_regain_access }] }
 *
 * This module reads those headers, exposes the current usage %, retries transient
 * / throttle errors with backoff (honoring estimated_time_to_regain_access), and
 * throws a tagged error only when it's genuinely non-retryable or retries are
 * exhausted — so a single flaky "code 1" never kills the whole job.
 *
 * Docs: https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
 */

// Error codes Meta returns for rate/throttle or transient conditions — all retryable.
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 80002, 80003, 80004])
const MAX_RETRIES = 5
const BASE_BACKOFF_MS = 2000
const MAX_BACKOFF_MS = 60000
// Proactive circuit breaker: stop making *optional* calls above this usage %.
export const USAGE_SOFT_LIMIT = 80

let lastUsagePct = 0

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Highest usage percentage seen on the most recent response (0-100). */
export function currentUsagePct() {
  return lastUsagePct
}

function parseUsage(res) {
  let pct = 0
  let regainMs = 0
  const app = res.headers.get('x-app-usage')
  if (app) {
    try {
      const u = JSON.parse(app)
      pct = Math.max(pct, u.call_count || 0, u.total_cputime || 0, u.total_time || 0)
    } catch {}
  }
  const buc = res.headers.get('x-business-use-case-usage')
  if (buc) {
    try {
      const obj = JSON.parse(buc)
      for (const arr of Object.values(obj)) {
        for (const e of arr || []) {
          pct = Math.max(pct, e.call_count || 0, e.total_cputime || 0, e.total_time || 0)
          if (e.estimated_time_to_regain_access) {
            regainMs = Math.max(regainMs, e.estimated_time_to_regain_access * 60 * 1000)
          }
        }
      }
    } catch {}
  }
  return { pct, regainMs }
}

/**
 * GET a fully-formed Graph API URL with rate-limit awareness + backoff.
 * Throws Error (with .code and .nonRetryable) when it truly can't succeed.
 */
export async function igGet(url) {
  let attempt = 0
  for (;;) {
    let res
    try {
      res = await fetch(url)
    } catch (netErr) {
      // Network hiccup — treat as transient.
      if (attempt >= MAX_RETRIES) throw netErr
      await sleep(Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt))
      attempt++
      continue
    }

    const { pct, regainMs } = parseUsage(res)
    lastUsagePct = pct

    let json
    try {
      json = await res.json()
    } catch {
      json = {}
    }

    if (res.ok && !json.error) return json

    const err = json.error || {}
    const code = err.code
    const retryable =
      RETRYABLE_CODES.has(code) || res.status === 429 || res.status >= 500 || pct >= 100

    if (!retryable || attempt >= MAX_RETRIES) {
      const e = new Error(err.message || `HTTP ${res.status}`)
      e.code = code
      e.nonRetryable = !retryable
      throw e
    }

    // Wait: prefer Meta's own estimate, else exponential backoff + jitter, capped.
    const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt)
    const jitter = Math.floor(backoff * 0.2 * Math.random())
    const wait = Math.min(MAX_BACKOFF_MS, regainMs > 0 ? regainMs : backoff) + jitter
    console.warn(
      `  rate/transient (code ${code ?? res.status}, usage ${pct}%) — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(wait / 1000)}s`
    )
    await sleep(wait)
    attempt++
  }
}
