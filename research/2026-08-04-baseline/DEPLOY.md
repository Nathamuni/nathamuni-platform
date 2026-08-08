# Deploy & rollback — foundations upgrade

Branch `feat/foundations-upgrade`. Production deploys from `main` via Cloudflare Workers
Builds, so **merging to `main` is the deploy**. Nothing here has been pushed.

## Before you merge

```bash
cd sites/nathamuni-com
npm run lint && npm run type-check && npm run build   # must pass
node scripts/smoke-check.mjs https://nathamuni.com    # baseline, BEFORE deploying
```

Keep that baseline output. It is what you compare against afterwards.

`npm test` currently fails 2 pre-existing blog assertions (889 words vs 900, no
`references`) — red on `main` already, unrelated to this branch.

## Deploy

```bash
git checkout main
git tag pre-upgrade-$(date +%Y%m%d)      # <- the rollback anchor. Do not skip.
git merge --no-ff feat/foundations-upgrade
git push origin main                     # Workers Builds picks this up
```

`--no-ff` matters: it creates a single merge commit that can be reverted as one unit.

## After deploy

```bash
node sites/nathamuni-com/scripts/smoke-check.mjs https://nathamuni.com
```

Expect **18/18**, with two INFO lines reporting configuration state rather than failure:

- `newsletter — closed (RESEND_API_KEY / JOIN_FROM_EMAIL not set yet)` until you add them
- `analytics — not enabled` until `NEXT_PUBLIC_CF_BEACON_TOKEN` is set **and the site is
  rebuilt** (Next inlines `NEXT_PUBLIC_*` at build time; a runtime binding cannot
  activate already-exported HTML — set it as a Workers **Build** variable)

Then by hand, because no script proves these:

1. Open a video with a public YouTube copy, e.g. `/videos/build-the-chain-why-systems-beat-motivation`.
   Press play. The player should size correctly and stay correctly sized.
2. Open `/sessions/diet-reset`, tick a step, reload — it should still be ticked.
3. If signed in: tick a step, reload immediately, confirm it was not reverted.
   *(This is the progress-loss race that was fixed; it is the one worth checking.)*
4. Tab through the homepage — focus ring visible on every stop.

## Rollback

**Fastest, no git:** Cloudflare dashboard → Workers & Pages → the project → Deployments →
pick the previous deployment → Rollback. Instant, and it is the right move if the site is
visibly broken.

**Proper, via git:**

```bash
git checkout main
git revert -m 1 <merge-commit-sha>   # -m 1 = keep main's side
git push origin main
```

Reverting the merge commit undoes the whole upgrade in one step. To drop only part of it,
every phase is its own commit and independently revertable:

| Tag | What it is |
|---|---|
| `pre-upgrade-<date>` | production immediately before the merge |
| `phase-1-media` | image pipeline |
| `phase-2-runtime` | animation loops |
| `phase-3-boundary` | server/client split |
| `phase-4-a11y` | dialogs, contrast, headings |
| `phase-5-tokens` | design tokens |
| `phase-6-honesty` | privacy, RSS, search index |

## The one thing rollback does NOT undo

Thumbnail originals moved to `assets/thumbnails/` and `public/images/thumbnails/` became
build-generated. A git revert restores the old layout correctly, **but** if the daily
Instagram sync has run against the new layout in the meantime, new originals will be
sitting in `assets/thumbnails/` where the reverted code does not look for them.

Recovery: copy them across, or just re-run the sync — originals are always re-downloadable
from Instagram.

```bash
cp sites/nathamuni-com/assets/thumbnails/*.jpg sites/nathamuni-com/public/images/thumbnails/
```

Everything else on this branch is code and config; reverting is clean.

## Live state at time of writing (measured, not assumed)

`node scripts/smoke-check.mjs https://nathamuni.com` → **12/19**, and one result deserves
attention:

> `newsletter — LIVE and validating (secrets configured)`

Production returns 400 to an invalid address rather than 503, which means the `INBOX` KV
namespace **is** bound and `/api/join` is accepting signups today — storing addresses that
currently have no send path. Anyone who has signed up is waiting for a newsletter that
cannot be sent.

After this deploy that endpoint returns an honest 503 until `RESEND_API_KEY` and
`JOIN_FROM_EMAIL` are set. Check whether the list already has entries before assuming it
is empty:

```bash
npx wrangler kv key list --binding INBOX | grep '"join:'
```
