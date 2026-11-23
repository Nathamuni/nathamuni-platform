/**
 * nathamuni.com/diet/latest.zip — the one download link that never changes.
 *
 * Each release lives at its own immutable path (/downloads/diet/<name>-v<version>.zip,
 * added by scripts/diet-release.mjs); this redirects to whichever is newest in
 * lib/diet.json. The redirect is not cached, so a new release takes effect on deploy.
 */

import manifest from '../lib/diet.json'

export const DIET_LATEST_PATH = '/diet/latest.zip'

export function handleDietLatest(request, data = manifest) {
  const latest = data.releases?.[0]
  if (!latest) {
    return new Response('No version of the diet plugin has been published yet.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL(latest.file, request.url).toString(),
      'cache-control': 'no-store',
    },
  })
}
