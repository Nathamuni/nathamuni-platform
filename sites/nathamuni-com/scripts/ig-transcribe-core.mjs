// Pure helpers for the reel-transcription job (I/O lives in ig-transcribe.mjs).

export const shortcodeOf = (permalink) => permalink.replace(/\/$/, '').split('/').pop().split('?')[0]

/**
 * Video reels that still need a transcript, newest first, capped at `limit`.
 * Done = any stored entry ("ok" or "no-speech"); errors are never stored, so they retry.
 */
export function selectPending(media, existing, limit) {
  return media
    .filter((m) => m.media_type === 'VIDEO' && m.media_url && m.permalink)
    .map((m) => ({ ...m, shortcode: shortcodeOf(m.permalink) }))
    .filter((m) => !existing[m.shortcode])
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

/** Fold Whisper results into the stored transcripts. Errors are skipped so they retry next run. */
export function mergeResults(existing, results, meta, { model, now }) {
  const out = { ...existing }
  let added = 0
  for (const [sc, r] of Object.entries(results)) {
    if (!r || (r.status !== 'ok' && r.status !== 'no-speech')) continue
    out[sc] = {
      ...r,
      publishedAt: meta[sc]?.timestamp ?? null,
      model,
      transcribedAt: now,
    }
    added++
  }
  // Stable key order (newest first) keeps git diffs small.
  const sorted = Object.fromEntries(
    Object.entries(out).sort((a, b) => (b[1].publishedAt ?? '').localeCompare(a[1].publishedAt ?? '')),
  )
  return { transcripts: sorted, added }
}
