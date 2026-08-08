/**
 * Client-side progress storage shared by the course/session trackers and the
 * optional account sync. Everything here is SSR-safe: every `window` /
 * `localStorage` touch is guarded so this module can be imported from server
 * components without throwing.
 *
 * Local-first by design: `loadItem`/`saveItem` always read and write
 * localStorage directly, regardless of auth state. `saveItem` additionally
 * schedules a debounced `syncUp()` that — only when a user is signed in
 * (`setAuthed(true)`) — pushes the full local progress blob to
 * `/api/auth/progress` so it follows them to another device. Signed-out
 * visitors never make that request; their progress simply stays in this
 * browser.
 */

const SYNC_DEBOUNCE_MS = 1200

/** Prefixes of the localStorage keys that make up "progress" worth syncing. */
export const PROGRESS_PREFIXES = ['course-', 'session-', 'metrics-'] as const

let authed = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Keys this tab has written locally that the server has not been told about yet.
 *
 * Session hydration is asynchronous, so there is a window on every page load where the
 * visitor is signed in but `authed` is still false: writes in that window skip
 * scheduleSyncUp(), and then applyProgress() lands the server's older blob on top of
 * them, silently discarding a just-checked step. applyProgress() therefore refuses to
 * overwrite anything in this set, and pushes it up instead.
 */
const locallyDirty = new Set<string>()

/** Flip the module-level "is this visitor signed in" flag. */
export function setAuthed(value: boolean): void {
  authed = value
}

export function isAuthed(): boolean {
  return authed
}

export function loadItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    /* localStorage unavailable (privacy mode) */
    return null
  }
}

export function saveItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  // Recorded before the write so a value entered pre-hydration still wins over the
  // server copy that arrives moments later.
  if (!authed) locallyDirty.add(key)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* localStorage unavailable (privacy mode) — nothing we can do */
  }
  scheduleSyncUp()
}

function scheduleSyncUp(): void {
  if (typeof window === 'undefined') return
  if (!authed) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void syncUp()
  }, SYNC_DEBOUNCE_MS)
}

/** Gather every localStorage key that matches a progress prefix. */
export function collectProgress(): Record<string, string> {
  const result: Record<string, string> = {}
  if (typeof window === 'undefined') return result
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key) continue
      if (!PROGRESS_PREFIXES.some((prefix) => key.startsWith(prefix))) continue
      const value = window.localStorage.getItem(key)
      if (value !== null) result[key] = value
    }
  } catch {
    /* localStorage unavailable (privacy mode) — nothing to collect */
  }
  return result
}

/**
 * Write a server-provided progress blob into localStorage (e.g. right after
 * login/signup, or on initial `/api/auth/me` hydration), then notify any
 * mounted trackers so they re-read their state.
 */
export function applyProgress(obj: Record<string, string>): void {
  if (typeof window === 'undefined') return
  let hadLocalEdits = false
  try {
    for (const [key, value] of Object.entries(obj)) {
      if (!PROGRESS_PREFIXES.some((prefix) => key.startsWith(prefix))) continue
      // Anything edited in this tab before the session was known wins: the server copy
      // is older by definition, and overwriting it would throw away work the visitor
      // just did. Those keys go up on the next sync instead.
      if (locallyDirty.has(key)) {
        hadLocalEdits = true
        continue
      }
      window.localStorage.setItem(key, value)
    }
  } catch {
    /* localStorage unavailable (privacy mode) */
  }
  window.dispatchEvent(new Event('nm-progress-applied'))
  // Push the preserved local edits so the server stops being stale.
  if (hadLocalEdits) scheduleSyncUp()
}

/**
 * Push the full local progress blob to the server. No-op when not
 * authenticated. Failures are swallowed — sync is best-effort and must never
 * interrupt the local-first experience.
 */
export async function syncUp(): Promise<void> {
  if (!authed) return
  if (typeof window === 'undefined') return
  try {
    const res = await fetch('/api/auth/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ progress: collectProgress() }),
    })
    // The server now has these; they no longer need protecting from applyProgress.
    // Only cleared on success, so a failed sync keeps them shielded.
    if (res.ok) locallyDirty.clear()
  } catch {
    /* ignore — best-effort sync, local copy is always the source of truth */
  }
}
