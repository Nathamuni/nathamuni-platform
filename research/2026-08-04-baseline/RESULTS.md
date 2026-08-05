# Foundations upgrade — verified results

Branch `feat/foundations-upgrade`, 10 commits on top of `e068b97`. Measured 2026-08-05.
Every number below was measured, not estimated. Baseline in `README.md`.

## Outcomes

| Metric | Before | After | Note |
|---|---|---|---|
| Image bytes sent to a browser | 20.6 MB | **6.9 MB** | −66%; JPEGs stay on disk for OG only |
| Video catalog in client JS | 105 KB raw / 25 KB gz | **0** | verified absent from every chunk |
| `.next/static` | 1.4 MB | 1.3 MB | |
| `index.html` gzip | 11,199 | 15,503 | intentional: grid now in HTML, not a 120 KB fetch |
| `videos.html` gzip | 47,694 | 48,788 | `<picture>` markup; catalog chunk gone |
| Text below WCAG AA on `/videos` | 789 nodes | **0 of 1,139** | worst case now 6.23:1 |
| `public/` on disk | 74 MB | 70 MB | both formats now stored |

## How each claim was verified

- **Catalog removed** — probed built chunks for a known video id
  (`50-thinkers-6-months-separating-action-from-reaction`); present before, absent after.
- **Homepage server-rendered** — `out/index.html` contains 9 `data-testid="video-card"`
  and zero occurrences of `Loading...`.
- **No broken images** — all 171 non-null `videos.json` thumbnails and all 64
  `stories.json` posters resolve to both a `.jpg` and a `.webp` in `out/`. 0 missing,
  0 non-jpg paths. `og:image` and `VideoObject.thumbnailUrl` still resolve to `.jpg`.
- **Token layer visually neutral** — real browser computed styles:
  `rgb(var(--accent-rgb) / 0.32)` resolves to exactly `rgba(139, 92, 246, 0.32)`;
  card background/border unchanged; no unresolved `var()`.
- **Contrast** — browser sweep of 1,139 text nodes on `/videos`: 0 below 4.5:1.
- **PulseGraph parks and wakes** — canvas draw ops: **0 over 3s at rest**, then
  **40,533 in 1.2s** after a single `pointermove`.
- **Heading semantics** — `/pulse` now has exactly one `h1`
  ("The content network, alive."), status badge is `role="status"`.
- **Focus trap** — 4 unit tests (enter, Tab wrap, Shift+Tab wrap, restore on unmount).
- **Sync workflow** — `git check-ignore` confirms `public/images/thumbnails` ignored and
  `assets/thumbnails` not; a simulated new thumbnail stages correctly.

## Two bugs found *by* verification, after the phases were "done"

1. **BLOCKER — `instagram-sync.yml` committed the generated dir.** It did
   `git add public/images/thumbnails`, which Phase 1 made gitignored. New reels'
   thumbnails would never have been committed, and the next build would then fail hard
   on a missing source image, blocking deploys. Fixed in `0fb402e`.
2. **`PulseGraph` could park mid-drag.** Holding a node still fires no `pointermove`, so
   the idle timer expired with `dragNode` set and froze the other nodes. Fixed in `ae01f7e`.

A third was caught during Phase 4 by its own new tests: filtering focusables on
`offsetParent !== null` finds nothing when the container is `position: fixed` — which
every one of these dialogs is. The trap would have silently done nothing.

## Deliberately NOT done, and why

- **`wrangler deploy` in CI** — deploys run via Cloudflare Workers Builds from `main`;
  adding it would double-deploy.
- **Removing `cp lib/videos.json public/videos.json`** — `worker/index.mjs:406` serves
  `/api/videos` from that asset.
- **Scoping `AuthProvider` to account routes** — Nav and AccountWidget show signed-in
  state on every page; scoping it would break them. Deferred to idle instead.
- **Homepage `metadata`** — already inherited correctly from `app/layout.tsx`.
- **Analytics** — Cloudflare Web Analytics needs a beacon token from the owner.
- **GSAP / full shadcn** — see the plan's "explicitly not doing" section.

## Remaining work

1. **122 inline hex values in `.tsx` are not yet tokenised.** The token layer exists and
   `globals.css` consumes it; this is the second half, and the precondition for making a
   bold redesign a token change rather than a 63-component edit.
2. **`lib/blog.test.ts` fails 2 tests on `main`, unrelated to this branch** —
   `real-confidence-is-not-a-posture` is 889 words (needs 900) and has no `references`.
   Left alone deliberately: it is content, and the test may be right.
3. **Codex review did not complete.** Two runs hung (prompt fed via heredoc stdin; killing
   the parent shell left the process blocked on a read) and the retry was cancelled.
   Verification above is first-party.
4. Privacy page routes deletion requests to Instagram DMs — no contact email exists in
   the repo and one was not invented.

## Test state

`npm run lint` clean · `npm run type-check` clean · `npm run build` exit 0 ·
`npm test` 302 passing, 2 failing (both pre-existing, item 2 above).

Two tests were modified, both disclosed in their commits:
- `BackToTop.test.tsx` — awaits a frame, because the handler is now rAF-coalesced.
- `Footer.test.tsx` — asserted the literal false string "No servers. No trackers."
